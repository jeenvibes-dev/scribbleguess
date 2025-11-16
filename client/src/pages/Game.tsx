import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AvatarDisplay } from "@/components/AvatarDisplay";
import { CircularTimer } from "@/components/CircularTimer";
import { DrawingCanvas, type DrawingCanvasRef } from "@/components/DrawingCanvas";
import { type Player, type Message, type GameState, type DrawingData, type Room, type ServerMessage } from "@shared/schema";
import { Send, Trophy, Paintbrush, Home } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Game() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [showRoundEnd, setShowRoundEnd] = useState(false);
  const [roundEndWord, setRoundEndWord] = useState("");
  const [showGameEnd, setShowGameEnd] = useState(false);
  const [winner, setWinner] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);

  const params = new URLSearchParams(location.split("?")[1] || "");
  const roomCodeFromUrl = params.get("room");
  const playerIdFromUrl = params.get("playerId");

  useEffect(() => {
    if (playerIdFromUrl) {
      setPlayerId(playerIdFromUrl);
    }
  }, [playerIdFromUrl]);

  const handleMessage = useCallback((message: ServerMessage) => {
    if (message.type === "game_started") {
      setGameState(message.gameState);
    } else if (message.type === "game_state_updated") {
      setGameState(message.gameState);
    } else if (message.type === "room_updated") {
      setRoom(message.room);
    } else if (message.type === "drawing_update") {
      canvasRef.current?.applyDrawing(message.drawingData);
    } else if (message.type === "chat_message") {
      setMessages(prev => [...prev, message.message]);
    } else if (message.type === "round_end") {
      setRoundEndWord(message.correctWord);
      setShowRoundEnd(true);
      setTimeout(() => setShowRoundEnd(false), 2500);
    } else if (message.type === "game_end") {
      setWinner(message.winner);
      setShowGameEnd(true);
    } else if (message.type === "brush_modified") {
      toast({
        title: "Brush Modified!",
        description: message.modifier.mirror ? "Mirror mode activated!" : 
                    message.modifier.color ? `Color changed to ${message.modifier.color}` :
                    `Brush size changed to ${message.modifier.size}`,
      });
    } else if (message.type === "error") {
      toast({
        title: "Error",
        description: message.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const { sendMessage, isConnected, setMessageHandler } = useWebSocketContext();

  useEffect(() => {
    setMessageHandler(handleMessage);
  }, [handleMessage, setMessageHandler]);

  const isDrawer = gameState?.drawerIds.includes(playerId || "") || false;
  const currentPlayer = room?.players.find(p => p.id === playerId);
  const sortedPlayers = room ? [...room.players].sort((a, b) => b.score - a.score) : [];

  const handleSendMessage = () => {
    if (chatMessage.trim() && roomCodeFromUrl) {
      sendMessage({
        type: "chat",
        roomCode: roomCodeFromUrl,
        message: chatMessage.trim(),
      });
      setChatMessage("");
    }
  };

  const handleDraw = (data: DrawingData) => {
    if (roomCodeFromUrl) {
      sendMessage({
        type: "draw",
        roomCode: roomCodeFromUrl,
        drawingData: data,
      });
    }
  };

  const handleClear = () => {
    if (roomCodeFromUrl) {
      sendMessage({
        type: "draw",
        roomCode: roomCodeFromUrl,
        drawingData: { type: "clear" },
      });
    }
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!gameState || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="max-w-7xl mx-auto py-4">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Round {gameState.currentRound}/{gameState.totalRounds}
            </Badge>
            {isDrawer ? (
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                <Paintbrush className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">You're Drawing!</span>
              </div>
            ) : (
              <div className="text-xl font-bold tracking-wider font-mono" data-testid="text-word-display">
                {gameState.wordDisplay}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleGoHome} data-testid="button-home">
            <Home className="h-4 w-4 mr-2" />
            Leave Game
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                {isDrawer && (
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Your word is:</p>
                    <p className="text-2xl font-bold text-primary" data-testid="text-drawer-word">
                      {gameState.currentWord}
                    </p>
                  </div>
                )}
                <DrawingCanvas
                  ref={canvasRef}
                  isDrawer={isDrawer}
                  onDraw={handleDraw}
                  onClear={handleClear}
                  currentColor={gameState.currentBrushModifier?.color}
                  currentSize={gameState.currentBrushModifier?.size}
                  mirrorMode={gameState.currentBrushModifier?.mirror}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-center">
                  <CircularTimer
                    timeRemaining={gameState.timeRemaining}
                    totalTime={gameState.roundDuration}
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Scoreboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {sortedPlayers.map((player, index) => (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          gameState.drawerIds.includes(player.id)
                            ? "bg-primary/10 ring-2 ring-primary"
                            : player.hasGuessed
                            ? "bg-green-500/10"
                            : "bg-muted/50"
                        }`}
                        data-testid={`scoreboard-player-${player.id}`}
                      >
                        <div className="flex-shrink-0 w-6 text-center font-bold text-sm">
                          {index === 0 && "🥇"}
                          {index === 1 && "🥈"}
                          {index === 2 && "🥉"}
                          {index > 2 && `${index + 1}.`}
                        </div>
                        <AvatarDisplay avatar={player.avatar} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate flex items-center gap-1">
                            {player.id === playerId ? "You" : player.name}
                            {gameState.drawerIds.includes(player.id) && (
                              <Paintbrush className="h-3 w-3 text-primary" />
                            )}
                          </p>
                        </div>
                        <Badge variant={player.hasGuessed ? "default" : "secondary"}>
                          {player.score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-[400px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Chat & Guesses</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-2 pb-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded-lg text-sm animate-slide-in ${
                          msg.isSystem
                            ? "bg-muted/50 text-center italic text-muted-foreground"
                            : msg.isCorrect
                            ? "bg-green-500/20 border border-green-500/50"
                            : "bg-muted/50"
                        }`}
                        data-testid={`message-${msg.id}`}
                      >
                        {!msg.isSystem && (
                          <span className="font-semibold">
                            {msg.playerId === playerId ? "You" : msg.playerName}:{" "}
                          </span>
                        )}
                        {msg.content}
                        {msg.isCorrect && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Correct!
                          </Badge>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <Separator />
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        isDrawer
                          ? "You can't guess while drawing"
                          : currentPlayer?.hasGuessed
                          ? "You already guessed correctly!"
                          : "Type your guess..."
                      }
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      disabled={isDrawer || currentPlayer?.hasGuessed || false}
                      data-testid="input-chat-message"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!chatMessage.trim() || isDrawer || currentPlayer?.hasGuessed || false}
                      size="icon"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showRoundEnd} onOpenChange={setShowRoundEnd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Round Over!</DialogTitle>
            <DialogDescription>
              The word was: <span className="font-bold text-2xl text-primary">{roundEndWord}</span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showGameEnd} onOpenChange={setShowGameEnd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Game Over!</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="text-center">
                <p className="text-lg mb-2">Winner:</p>
                <p className="text-3xl font-bold text-primary">{winner}</p>
              </div>
              <Button onClick={handleGoHome} className="w-full">
                Return Home
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
