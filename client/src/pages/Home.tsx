import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paintbrush, Users, Shuffle } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { type ServerMessage, type Room, GameMode } from "@shared/schema";
import { type CustomAvatar, DEFAULT_AVATAR } from "@shared/avatarSchema";
import { useToast } from "@/hooks/use-toast";
import { AvatarCustomizer } from "@/components/AvatarCustomizer";

const STORAGE_KEYS = {
  AVATAR: "scribbleguess_custom_avatar",
  PLAYER_NAME: "scribbleguess_player_name",
} as const;

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [customAvatar, setCustomAvatar] = useState<CustomAvatar>(DEFAULT_AVATAR);

  // Load saved data from localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem(STORAGE_KEYS.AVATAR);
    const savedName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    
    if (savedAvatar) {
      try {
        setCustomAvatar(JSON.parse(savedAvatar));
      } catch (e) {
        console.error("Failed to parse saved avatar:", e);
      }
    }
    
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Save avatar to localStorage whenever it changes
  const handleAvatarChange = (newAvatar: CustomAvatar) => {
    setCustomAvatar(newAvatar);
    localStorage.setItem(STORAGE_KEYS.AVATAR, JSON.stringify(newAvatar));
  };

  // Save player name to localStorage
  const handleNameChange = (name: string) => {
    setPlayerName(name);
    if (name.trim()) {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    }
  };

  const handleMessage = useCallback((message: ServerMessage) => {
    if (message.type === "room_created") {
      setPlayerId(message.playerId);
      setRoom(message.room);
      localStorage.setItem(`room_${message.room.code}`, JSON.stringify(message.room));
      localStorage.setItem(`player_${message.room.code}`, message.playerId);
      localStorage.setItem(`avatar_${message.room.code}`, JSON.stringify(customAvatar));
      setLocation(`/lobby?room=${message.room.code}&playerId=${message.playerId}`);
    } else if (message.type === "room_joined") {
      setPlayerId(message.playerId);
      setRoom(message.room);
      localStorage.setItem(`room_${message.room.code}`, JSON.stringify(message.room));
      localStorage.setItem(`player_${message.room.code}`, message.playerId);
      localStorage.setItem(`avatar_${message.room.code}`, JSON.stringify(customAvatar));
      setLocation(`/lobby?room=${message.room.code}&playerId=${message.playerId}`);
    } else if (message.type === "error") {
      toast({
        title: "Error",
        description: message.message,
        variant: "destructive",
      });
    }
  }, [setLocation, toast, customAvatar]);

  const { sendMessage, isConnected, subscribe } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe(handleMessage);
    return unsubscribe;
  }, [handleMessage, subscribe]);

  const handleCreateRoom = () => {
    if (playerName.trim() && isConnected) {
      // For now, use a placeholder avatar ID - server will need updating
      const placeholderAvatar = "avatar-1" as any;
      sendMessage({
        type: "create_room",
        playerName: playerName.trim(),
        avatar: placeholderAvatar,
        gameMode: GameMode.CLASSIC,
      });
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim() && isConnected) {
      const placeholderAvatar = "avatar-1" as any;
      sendMessage({
        type: "join_room",
        roomCode: roomCode.trim().toUpperCase(),
        playerName: playerName.trim(),
        avatar: placeholderAvatar,
      });
    }
  };

  const handleJoinRandomRoom = () => {
    if (playerName.trim() && isConnected) {
      const placeholderAvatar = "avatar-1" as any;
      sendMessage({
        type: "join_random_room",
        playerName: playerName.trim(),
        avatar: placeholderAvatar,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center space-y-4 animate-slide-in">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.svg" alt="ScribbleGuess Logo" className="h-16 w-16" />
            <h1 className="text-5xl md:text-6xl font-bold text-primary">
              ScribbleGuess
            </h1>
          </div>
          <p className="text-xl text-muted-foreground font-medium">
            Draw, Guess, and Have Fun with Friends!
          </p>
          {!isConnected && (
            <p className="text-sm text-yellow-600">Connecting to server...</p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Avatar Customizer */}
          <AvatarCustomizer avatar={customAvatar} onAvatarChange={handleAvatarChange} />

          {/* Game Options */}
          <div className="space-y-6">
            <Card className="hover-elevate active-elevate-2">
              <CardHeader>
                <CardTitle className="text-center">Enter Your Name</CardTitle>
                <CardDescription className="text-center">Join or create a game room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="player-name">Your Name</Label>
                  <Input
                    id="player-name"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && playerName.trim()) {
                        handleCreateRoom();
                      }
                    }}
                    maxLength={20}
                    data-testid="input-player-name-create"
                    className="text-center text-lg"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Button
                      onClick={handleCreateRoom}
                      disabled={!playerName.trim() || !isConnected}
                      className="w-full h-14 text-lg font-semibold"
                      data-testid="button-create-room"
                    >
                      <Paintbrush className="mr-2 h-5 w-5" />
                      Create Private Game
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Input
                        id="room-code"
                        placeholder="Room Code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                        maxLength={6}
                        className="font-mono text-lg tracking-wider text-center"
                        data-testid="input-room-code"
                      />
                    </div>
                    <Button
                      onClick={handleJoinRoom}
                      disabled={!playerName.trim() || !roomCode.trim() || !isConnected}
                      className="w-full h-14 text-lg font-semibold"
                      variant="outline"
                      data-testid="button-join-room"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Join Private Game
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 hover-elevate active-elevate-2">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Shuffle className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">Feeling Lucky?</h3>
                      <p className="text-sm text-muted-foreground">Join any available room with a random game mode!</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleJoinRandomRoom}
                    disabled={!playerName.trim() || !isConnected}
                    variant="default"
                    size="lg"
                    className="w-full md:w-auto h-12 text-lg font-semibold"
                    data-testid="button-join-random-room"
                  >
                    <Shuffle className="mr-2 h-5 w-5" />
                    Join Random Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
