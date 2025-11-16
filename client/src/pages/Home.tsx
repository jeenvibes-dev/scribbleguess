import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paintbrush, Users } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { type ServerMessage, type AvatarId, type Room, GameMode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

  const handleMessage = useCallback((message: ServerMessage) => {
    if (message.type === "room_created") {
      setPlayerId(message.playerId);
      setRoom(message.room);
      localStorage.setItem(`room_${message.room.code}`, JSON.stringify(message.room));
      localStorage.setItem(`player_${message.room.code}`, message.playerId);
      setLocation(`/lobby?room=${message.room.code}&playerId=${message.playerId}`);
    } else if (message.type === "room_joined") {
      setPlayerId(message.playerId);
      setRoom(message.room);
      localStorage.setItem(`room_${message.room.code}`, JSON.stringify(message.room));
      localStorage.setItem(`player_${message.room.code}`, message.playerId);
      setLocation(`/lobby?room=${message.room.code}&playerId=${message.playerId}`);
    } else if (message.type === "error") {
      toast({
        title: "Error",
        description: message.message,
        variant: "destructive",
      });
    }
  }, [setLocation, toast]);

  const { sendMessage, isConnected, subscribe } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe(handleMessage);
    return unsubscribe;
  }, [handleMessage, subscribe]);

  const handleCreateRoom = () => {
    if (playerName.trim() && isConnected) {
      const randomAvatar = `avatar-${Math.floor(Math.random() * 12) + 1}` as AvatarId;
      sendMessage({
        type: "create_room",
        playerName: playerName.trim(),
        avatar: randomAvatar,
        gameMode: GameMode.CLASSIC,
      });
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim() && isConnected) {
      const randomAvatar = `avatar-${Math.floor(Math.random() * 12) + 1}` as AvatarId;
      sendMessage({
        type: "join_room",
        roomCode: roomCode.trim().toUpperCase(),
        playerName: playerName.trim(),
        avatar: randomAvatar,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-4 animate-slide-in">
          <div className="flex items-center justify-center gap-3">
            <Paintbrush className="h-12 w-12 text-primary" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Doodle Guess
            </h1>
          </div>
          <p className="text-xl text-muted-foreground font-medium">
            Draw, Guess, and Have Fun with Friends!
          </p>
          {!isConnected && (
            <p className="text-sm text-yellow-600">Connecting to server...</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover-elevate active-elevate-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-primary" />
                Create Room
              </CardTitle>
              <CardDescription>Start a new game and invite your friends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Your Name</Label>
                <Input
                  id="create-name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                  maxLength={20}
                  data-testid="input-player-name-create"
                />
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={!playerName.trim() || !isConnected}
                className="w-full h-12 text-lg font-semibold"
                data-testid="button-create-room"
              >
                Create Game Room
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Join Room
              </CardTitle>
              <CardDescription>Enter a room code to join a game</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-name">Your Name</Label>
                <Input
                  id="join-name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  data-testid="input-player-name-join"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-code">Room Code</Label>
                <Input
                  id="room-code"
                  placeholder="Enter 6-digit code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  maxLength={6}
                  className="font-mono text-lg tracking-wider"
                  data-testid="input-room-code"
                />
              </div>
              <Button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomCode.trim() || !isConnected}
                className="w-full h-12 text-lg font-semibold"
                data-testid="button-join-room"
              >
                Join Game
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 border-dashed">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold text-base mb-2 text-primary">How to Play</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• One player draws the given word</li>
                  <li>• Other players try to guess it</li>
                  <li>• Earn points for correct guesses</li>
                  <li>• Take turns and have fun!</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-base mb-2 text-primary">Game Modes</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <span className="font-medium">Classic:</span> Traditional gameplay</li>
                  <li>• <span className="font-medium">Double Draw:</span> Two artists, one word</li>
                  <li>• <span className="font-medium">Blitz:</span> Fast 15-second rounds</li>
                  <li>• <span className="font-medium">Randomized:</span> Unpredictable tools</li>
                  <li>• <span className="font-medium">Mega:</span> Up to 50 players!</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
