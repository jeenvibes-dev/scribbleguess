import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  type WsMessage,
  type ServerMessage,
  type Player,
  type Message,
  type DrawingData,
  GameMode,
} from "@shared/schema";
import {
  getRandomWord,
  createWordDisplay,
  initializeGameState,
  getNextDrawers,
  checkGuess,
  calculateScore,
  getRandomBrushModifier,
  shouldApplyRandomModifier,
} from "./gameLogic";
import { randomUUID } from "crypto";

interface ExtendedWebSocket extends WebSocket {
  playerId?: string;
  roomCode?: string;
}

const roomTimers = new Map<string, NodeJS.Timeout>();
const randomizedTimers = new Map<string, NodeJS.Timeout>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: ExtendedWebSocket) => {
    console.log("Client connected");

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString()) as WsMessage;
        handleMessage(ws, message, wss);
      } catch (error) {
        console.error("Error parsing message:", error);
        sendToClient(ws, { type: "error", message: "Invalid message format" });
      }
    });

    ws.on("close", () => {
      if (ws.playerId && ws.roomCode) {
        handlePlayerDisconnect(ws, wss);
      }
    });
  });

  function handleMessage(ws: ExtendedWebSocket, message: WsMessage, wss: WebSocketServer) {
    switch (message.type) {
      case "create_room":
        handleCreateRoom(ws, message, wss);
        break;
      case "join_room":
        handleJoinRoom(ws, message, wss);
        break;
      case "rejoin_room":
        handleRejoinRoom(ws, message, wss);
        break;
      case "start_game":
        handleStartGame(ws, message, wss);
        break;
      case "draw":
        handleDraw(ws, message, wss);
        break;
      case "chat":
        handleChat(ws, message, wss);
        break;
      case "update_avatar":
        handleUpdateAvatar(ws, message, wss);
        break;
    }
  }

  function handleCreateRoom(ws: ExtendedWebSocket, message: WsMessage & { type: "create_room" }, wss: WebSocketServer) {
    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      name: message.playerName,
      avatar: message.avatar,
      score: 0,
      hasGuessed: false,
    };

    const room = storage.createRoom(playerId, message.gameMode);
    storage.addPlayerToRoom(room.code, player);

    ws.playerId = playerId;
    ws.roomCode = room.code;

    const updatedRoom = storage.getRoom(room.code)!;
    sendToClient(ws, { type: "room_created", room: updatedRoom, playerId });
  }

  function handleJoinRoom(ws: ExtendedWebSocket, message: WsMessage & { type: "join_room" }, wss: WebSocketServer) {
    const room = storage.getRoom(message.roomCode);
    if (!room) {
      sendToClient(ws, { type: "error", message: "Room not found" });
      return;
    }

    if (room.isStarted) {
      sendToClient(ws, { type: "error", message: "Game already started" });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      sendToClient(ws, { type: "error", message: "Room is full" });
      return;
    }

    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      name: message.playerName,
      avatar: message.avatar,
      score: 0,
      hasGuessed: false,
    };

    storage.addPlayerToRoom(room.code, player);
    ws.playerId = playerId;
    ws.roomCode = room.code;

    const updatedRoom = storage.getRoom(room.code)!;
    sendToClient(ws, { type: "room_joined", room: updatedRoom, playerId });
    
    const gameState = storage.getGameState(room.code);
    if (gameState) {
      sendToClient(ws, { type: "game_state_updated", gameState });
      const messages = storage.getMessages(room.code);
      messages.forEach(msg => {
        sendToClient(ws, { type: "chat_message", message: msg });
      });
    }
    
    broadcastToRoom(room.code, { type: "room_updated", room: updatedRoom }, wss, playerId);

    const systemMessage: Message = {
      id: randomUUID(),
      playerId: "system",
      playerName: "System",
      content: `${message.playerName} joined the game!`,
      isCorrect: false,
      isSystem: true,
      timestamp: Date.now(),
    };
    storage.addMessage(room.code, systemMessage);
    broadcastToRoom(room.code, { type: "chat_message", message: systemMessage }, wss);
  }

  function handleRejoinRoom(ws: ExtendedWebSocket, message: WsMessage & { type: "rejoin_room" }, wss: WebSocketServer) {
    const room = storage.getRoom(message.roomCode);
    if (!room) {
      sendToClient(ws, { type: "error", message: "Room not found" });
      return;
    }

    const player = room.players.find(p => p.id === message.playerId);
    if (!player) {
      sendToClient(ws, { type: "error", message: "Player not found in room" });
      return;
    }

    ws.playerId = message.playerId;
    ws.roomCode = message.roomCode;

    sendToClient(ws, { type: "room_updated", room });

    const gameState = storage.getGameState(room.code);
    if (gameState && room.isStarted) {
      sendToClient(ws, { type: "game_state_updated", gameState });
      const messages = storage.getMessages(room.code);
      messages.forEach(msg => {
        sendToClient(ws, { type: "chat_message", message: msg });
      });
    }
  }

  function handleStartGame(ws: ExtendedWebSocket, message: WsMessage & { type: "start_game" }, wss: WebSocketServer) {
    const room = storage.getRoom(message.roomCode);
    if (!room || room.hostId !== ws.playerId) {
      sendToClient(ws, { type: "error", message: "Only host can start the game" });
      return;
    }

    if (room.players.length < 2) {
      sendToClient(ws, { type: "error", message: "Need at least 2 players" });
      return;
    }

    storage.updateRoom(room.code, { isStarted: true });
    const gameState = initializeGameState(room);
    storage.setGameState(room.code, gameState);

    const updatedRoom = storage.getRoom(room.code)!;
    broadcastToRoom(room.code, { type: "room_updated", room: updatedRoom }, wss);
    broadcastToRoom(room.code, { type: "game_started", gameState }, wss);

    const systemMessage: Message = {
      id: randomUUID(),
      playerId: "system",
      playerName: "System",
      content: `Round ${gameState.currentRound} started!`,
      isCorrect: false,
      isSystem: true,
      timestamp: Date.now(),
    };
    storage.addMessage(room.code, systemMessage);
    broadcastToRoom(room.code, { type: "chat_message", message: systemMessage }, wss);

    startRoundTimer(room.code, wss);

    if (room.gameMode === GameMode.RANDOMIZED) {
      startRandomizedTimer(room.code, wss);
    }
  }

  function handleDraw(ws: ExtendedWebSocket, message: WsMessage & { type: "draw" }, wss: WebSocketServer) {
    const room = storage.getRoom(message.roomCode);
    const gameState = storage.getGameState(message.roomCode);
    
    if (!room || !gameState) return;
    if (!gameState.drawerIds.includes(ws.playerId!)) return;

    broadcastToRoom(message.roomCode, { type: "drawing_update", drawingData: message.drawingData }, wss);
  }

  function handleChat(ws: ExtendedWebSocket, message: WsMessage & { type: "chat" }, wss: WebSocketServer) {
    const room = storage.getRoom(message.roomCode);
    const gameState = storage.getGameState(message.roomCode);
    
    if (!room || !gameState) return;

    const player = room.players.find(p => p.id === ws.playerId);
    if (!player) return;

    if (gameState.drawerIds.includes(player.id)) {
      return;
    }

    if (player.hasGuessed) {
      return;
    }

    const isCorrect = checkGuess(message.message, gameState.currentWord);
    
    const chatMessage: Message = {
      id: randomUUID(),
      playerId: player.id,
      playerName: player.name,
      content: message.message,
      isCorrect,
      isSystem: false,
      timestamp: Date.now(),
    };

    storage.addMessage(room.code, chatMessage);
    broadcastToRoom(room.code, { type: "chat_message", message: chatMessage }, wss);

    if (isCorrect) {
      const score = calculateScore(gameState.timeRemaining, gameState.roundDuration, false);
      player.score += score;
      player.hasGuessed = true;

      storage.updateRoom(room.code, { players: room.players });
      const updatedRoom = storage.getRoom(room.code)!;
      broadcastToRoom(room.code, { type: "room_updated", room: updatedRoom }, wss);

      const allGuessed = room.players.filter(p => !gameState.drawerIds.includes(p.id)).every(p => p.hasGuessed);
      if (allGuessed) {
        endRound(room.code, wss);
      }
    }
  }

  function handleUpdateAvatar(ws: ExtendedWebSocket, message: WsMessage & { type: "update_avatar" }, wss: WebSocketServer) {
    const room = storage.getRoom(message.roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === ws.playerId);
    if (player) {
      player.avatar = message.avatar;
      storage.updateRoom(room.code, { players: room.players });
      broadcastToRoom(room.code, { type: "room_updated", room: storage.getRoom(room.code)! }, wss);
    }
  }

  function handlePlayerDisconnect(ws: ExtendedWebSocket, wss: WebSocketServer) {
    if (!ws.roomCode || !ws.playerId) return;

    const roomBeforeRemoval = storage.getRoom(ws.roomCode);
    const room = storage.removePlayerFromRoom(ws.roomCode, ws.playerId);
    
    if (room) {
      const systemMessage: Message = {
        id: randomUUID(),
        playerId: "system",
        playerName: "System",
        content: `A player left the game`,
        isCorrect: false,
        isSystem: true,
        timestamp: Date.now(),
      };
      storage.addMessage(room.code, systemMessage);
      broadcastToRoom(room.code, { type: "room_updated", room }, wss);
      broadcastToRoom(room.code, { type: "chat_message", message: systemMessage }, wss);

      const gameState = storage.getGameState(room.code);
      if (gameState && gameState.drawerIds.includes(ws.playerId)) {
        endRound(room.code, wss);
      }
    } else {
      const timer = roomTimers.get(ws.roomCode);
      if (timer) {
        clearInterval(timer);
        roomTimers.delete(ws.roomCode);
      }
      const randTimer = randomizedTimers.get(ws.roomCode);
      if (randTimer) {
        clearInterval(randTimer);
        randomizedTimers.delete(ws.roomCode);
      }
    }
  }

  function startRoundTimer(roomCode: string, wss: WebSocketServer) {
    const existingTimer = roomTimers.get(roomCode);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(() => {
      const gameState = storage.getGameState(roomCode);
      if (!gameState) {
        clearInterval(timer);
        roomTimers.delete(roomCode);
        return;
      }

      gameState.timeRemaining -= 1;
      storage.setGameState(roomCode, gameState);

      if (gameState.timeRemaining <= 0) {
        endRound(roomCode, wss);
      } else {
        broadcastToRoom(roomCode, { type: "game_state_updated", gameState }, wss);
      }
    }, 1000);

    roomTimers.set(roomCode, timer);
  }

  function startRandomizedTimer(roomCode: string, wss: WebSocketServer) {
    const existingTimer = randomizedTimers.get(roomCode);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const timer = setInterval(() => {
      const gameState = storage.getGameState(roomCode);
      if (!gameState) {
        clearInterval(timer);
        randomizedTimers.delete(roomCode);
        return;
      }

      const modifier = getRandomBrushModifier();
      gameState.currentBrushModifier = modifier;
      storage.setGameState(roomCode, gameState);
      
      broadcastToRoom(roomCode, { type: "brush_modified", modifier }, wss);
      broadcastToRoom(roomCode, { type: "game_state_updated", gameState }, wss);
    }, 10000);

    randomizedTimers.set(roomCode, timer);
  }

  function endRound(roomCode: string, wss: WebSocketServer) {
    const room = storage.getRoom(roomCode);
    const gameState = storage.getGameState(roomCode);
    
    if (!room || !gameState) return;

    const timer = roomTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      roomTimers.delete(roomCode);
    }

    const randTimer = randomizedTimers.get(roomCode);
    if (randTimer) {
      clearInterval(randTimer);
      randomizedTimers.delete(roomCode);
    }

    gameState.isRoundActive = false;
    storage.setGameState(roomCode, gameState);

    const anyCorrectGuesses = room.players.some(p => !gameState.drawerIds.includes(p.id) && p.hasGuessed);
    if (anyCorrectGuesses) {
      gameState.drawerIds.forEach(drawerId => {
        const drawer = room.players.find(p => p.id === drawerId);
        if (drawer) {
          drawer.score += calculateScore(gameState.timeRemaining, gameState.roundDuration, true);
        }
      });
    }

    storage.updateRoom(roomCode, { players: room.players });
    const updatedRoom = storage.getRoom(roomCode)!;

    const scores = room.players.reduce((acc, p) => {
      acc[p.id] = p.score;
      return acc;
    }, {} as Record<string, number>);

    broadcastToRoom(roomCode, { type: "room_updated", room: updatedRoom }, wss);
    broadcastToRoom(roomCode, { 
      type: "round_end", 
      correctWord: gameState.currentWord,
      scores 
    }, wss);

    setTimeout(() => {
      if (gameState.currentRound >= gameState.totalRounds) {
        endGame(roomCode, wss);
      } else {
        startNextRound(roomCode, wss);
      }
    }, 3000);
  }

  function startNextRound(roomCode: string, wss: WebSocketServer) {
    const room = storage.getRoom(roomCode);
    const gameState = storage.getGameState(roomCode);
    
    if (!room || !gameState) return;

    room.players.forEach(p => {
      p.hasGuessed = false;
    });
    storage.updateRoom(roomCode, { players: room.players });

    const nextDrawers = getNextDrawers(room, gameState.drawerIds);
    const newWord = getRandomWord();
    
    gameState.currentRound += 1;
    gameState.currentWord = newWord;
    gameState.wordDisplay = createWordDisplay(newWord, false);
    gameState.drawerIds = nextDrawers;
    gameState.timeRemaining = gameState.roundDuration;
    gameState.isRoundActive = true;
    gameState.currentBrushModifier = undefined;

    storage.setGameState(roomCode, gameState);

    const updatedRoom = storage.getRoom(roomCode)!;
    broadcastToRoom(roomCode, { type: "room_updated", room: updatedRoom }, wss);

    broadcastToRoom(roomCode, { type: "drawing_update", drawingData: { type: "clear" } }, wss);

    const systemMessage: Message = {
      id: randomUUID(),
      playerId: "system",
      playerName: "System",
      content: `Round ${gameState.currentRound} started!`,
      isCorrect: false,
      isSystem: true,
      timestamp: Date.now(),
    };
    storage.addMessage(roomCode, systemMessage);

    broadcastToRoom(roomCode, { type: "game_state_updated", gameState }, wss);
    broadcastToRoom(roomCode, { type: "chat_message", message: systemMessage }, wss);

    startRoundTimer(roomCode, wss);

    if (room.gameMode === GameMode.RANDOMIZED) {
      startRandomizedTimer(roomCode, wss);
    }
  }

  function endGame(roomCode: string, wss: WebSocketServer) {
    const room = storage.getRoom(roomCode);
    const gameState = storage.getGameState(roomCode);
    
    if (!room || !gameState) return;

    const timer = roomTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      roomTimers.delete(roomCode);
    }

    const randTimer = randomizedTimers.get(roomCode);
    if (randTimer) {
      clearInterval(randTimer);
      randomizedTimers.delete(roomCode);
    }

    const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    
    const finalScores = room.players.reduce((acc, p) => {
      acc[p.id] = p.score;
      return acc;
    }, {} as Record<string, number>);

    broadcastToRoom(roomCode, { 
      type: "game_end", 
      finalScores,
      winner: winner.name 
    }, wss);
  }

  function sendToClient(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  function broadcastToRoom(roomCode: string, message: ServerMessage, wss: WebSocketServer, excludePlayerId?: string) {
    wss.clients.forEach((client) => {
      const extClient = client as ExtendedWebSocket;
      if (extClient.roomCode === roomCode && (excludePlayerId === undefined || extClient.playerId !== excludePlayerId)) {
        sendToClient(client, message);
      }
    });
  }

  return httpServer;
}
