import { type Room, type Player, type GameState, type Message, GameMode } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createRoom(hostId: string, gameMode: GameMode): Room;
  getRoom(code: string): Room | undefined;
  addPlayerToRoom(code: string, player: Player): Room | undefined;
  updateRoom(code: string, updates: Partial<Room>): Room | undefined;
  removePlayerFromRoom(code: string, playerId: string): Room | undefined;
  getRoomByPlayerId(playerId: string): Room | undefined;
  getAllRooms(): Room[];
  getGameState(code: string): GameState | undefined;
  setGameState(code: string, state: GameState): void;
  updateGameState(code: string, updates: Partial<GameState>): GameState | undefined;
  addMessage(code: string, message: Message): void;
  getMessages(code: string): Message[];
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private gameStates: Map<string, GameState>;
  private roomMessages: Map<string, Message[]>;

  constructor() {
    this.rooms = new Map();
    this.gameStates = new Map();
    this.roomMessages = new Map();
  }

  createRoom(hostId: string, gameMode: GameMode): Room {
    const code = this.generateRoomCode();
    const maxPlayers = gameMode === GameMode.MEGA ? 50 : 12;
    
    const room: Room = {
      code,
      hostId,
      gameMode,
      players: [],
      maxPlayers,
      isStarted: false,
    };

    this.rooms.set(code, room);
    this.roomMessages.set(code, []);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  addPlayerToRoom(code: string, player: Player): Room | undefined {
    const room = this.rooms.get(code);
    if (!room || room.players.length >= room.maxPlayers) {
      return undefined;
    }

    room.players.push(player);
    this.rooms.set(code, room);
    return room;
  }

  updateRoom(code: string, updates: Partial<Room>): Room | undefined {
    const room = this.rooms.get(code);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(code, updatedRoom);
    return updatedRoom;
  }

  removePlayerFromRoom(code: string, playerId: string): Room | undefined {
    const room = this.rooms.get(code);
    if (!room) return undefined;

    room.players = room.players.filter(p => p.id !== playerId);
    
    if (room.players.length === 0) {
      this.rooms.delete(code);
      this.gameStates.delete(code);
      this.roomMessages.delete(code);
      return undefined;
    }

    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }

    this.rooms.set(code, room);
    return room;
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getGameState(code: string): GameState | undefined {
    return this.gameStates.get(code);
  }

  setGameState(code: string, state: GameState): void {
    this.gameStates.set(code, state);
  }

  updateGameState(code: string, updates: Partial<GameState>): GameState | undefined {
    const state = this.gameStates.get(code);
    if (!state) return undefined;

    const updatedState = { ...state, ...updates };
    this.gameStates.set(code, updatedState);
    return updatedState;
  }

  addMessage(code: string, message: Message): void {
    const messages = this.roomMessages.get(code) || [];
    messages.push(message);
    this.roomMessages.set(code, messages);
  }

  getMessages(code: string): Message[] {
    return this.roomMessages.get(code) || [];
  }

  private generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code: string;
    do {
      code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }
}

export const storage = new MemStorage();
