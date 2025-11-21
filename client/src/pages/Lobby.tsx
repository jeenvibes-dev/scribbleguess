import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CustomAvatarDisplay } from "@/components/CustomAvatarDisplay";
import { GameMode, type Room, type ServerMessage } from "@shared/schema";
import { type CustomAvatar, DEFAULT_AVATAR } from "@shared/avatarSchema";
import { Copy, Crown, Gamepad2, Users, Zap, Shuffle, UsersRound, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

const GAME_MODE_INFO = {
  [GameMode.CLASSIC]: {
    name: "Classic",
    description: "Traditional gameplay with 60s rounds",
    icon: Gamepad2,
    color: "text-blue-500",
    maxPlayers: 12,
  },
  [GameMode.DOUBLE_DRAW]: {
    name: "Double Draw",
    description: "Two players draw the same word together",
    icon: Users,
    color: "text-teal-500",
    maxPlayers: 12,
  },
  [GameMode.BLITZ]: {
    name: "Blitz",
    description: "Fast-paced 15-second rounds",
    icon: Zap,
    color: "text-yellow-500",
    maxPlayers: 12,
  },
  [GameMode.RANDOMIZED]: {
    name: "Randomized",
    description: "Random brush changes every 10 seconds",
    icon: Shuffle,
    color: "text-green-500",
    maxPlayers: 12,
  },
  [GameMode.MEGA]: {
    name: "Mega Mode",
    description: "1 drawer with up to 50 guessers",
    icon: UsersRound,
    color: "text-red-500",
    maxPlayers: 50,
  },
};

export default function Lobby() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const roomCodeFromUrl = params.get("room");
  const playerIdFromUrl = params.get("playerId");

  useEffect(() => {
    if (playerIdFromUrl) {
      setPlayerId(playerIdFromUrl);
    }
    if (roomCodeFromUrl) {
      const savedRoom = localStorage.getItem(`room_${roomCodeFromUrl}`);
      const savedPlayerId = localStorage.getItem(`player_${roomCodeFromUrl}`);
      
      if (savedRoom && savedPlayerId) {
        try {
          const parsedRoom = JSON.parse(savedRoom);
          setRoom(parsedRoom);
          setPlayerId(savedPlayerId);
        } catch (e) {
          console.error("Failed to parse saved room:", e);
        }
      }
    }
  }, [playerIdFromUrl, roomCodeFromUrl]);

  const handleMessage = useCallback((message: ServerMessage) => {
    if (message.type === "room_created" || message.type === "room_joined") {
      setRoom(message.room);
      setPlayerId(message.playerId);
    } else if (message.type === "room_updated") {
      setRoom(message.room);
      if (playerIdFromUrl && !playerId) {
        setPlayerId(playerIdFromUrl);
      }
    } else if (message.type === "game_started") {
      setLocation(`/game?room=${roomCodeFromUrl}&playerId=${playerId}`);
    } else if (message.type === "error") {
      toast({
        title: "Error",
        description: message.message,
        variant: "destructive",
      });
    }
  }, [roomCodeFromUrl, playerId, playerIdFromUrl, setLocation, toast]);

  const { sendMessage, isConnected, subscribe } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe(handleMessage);
    return unsubscribe;
  }, [handleMessage, subscribe]);

  useEffect(() => {
    if (isConnected && roomCodeFromUrl && playerIdFromUrl && !room) {
      sendMessage({
        type: "rejoin_room",
        roomCode: roomCodeFromUrl,
        playerId: playerIdFromUrl,
      });
    }
  }, [isConnected, roomCodeFromUrl, playerIdFromUrl, room, sendMessage]);

  const isHost = room?.hostId === playerId;

  const copyRoomCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      toast({
        title: "Room code copied!",
        description: "Share it with your friends to join the game.",
      });
    }
  };

  const handleModeChange = (gameMode: GameMode) => {
    if (room?.code && isHost && !room.isStarted) {
      sendMessage({
        type: "update_mode",
        roomCode: room.code,
        gameMode,
      });
    }
  };

  const handleStartGame = () => {
    if (room?.code && isHost) {
      sendMessage({
        type: "start_game",
        roomCode: room.code,
      });
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading lobby...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-6">
        <Card className="bg-card/95 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-3xl">Game Lobby</CardTitle>
                <CardDescription>Customize your game and wait for players</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Room Code</p>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono font-bold bg-muted px-4 py-2 rounded-md" data-testid="text-room-code">
                      {room.code}
                    </code>
                    <Button size="icon" variant="outline" onClick={copyRoomCode} data-testid="button-copy-code">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Mode</CardTitle>
                <CardDescription>
                  {isHost ? "Game mode can be changed before starting" : "Selected by host"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(GAME_MODE_INFO).map(([mode, info]) => {
                    const Icon = info.icon;
                    const isSelected = room.gameMode === mode;
                    const canChange = isHost && !room.isStarted;
                    return (
                      <button
                        key={mode}
                        onClick={() => canChange && handleModeChange(mode as GameMode)}
                        disabled={!canChange}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card"
                        } ${
                          canChange
                            ? "hover-elevate active-elevate-2 cursor-pointer"
                            : "cursor-default opacity-75"
                        }`}
                        data-testid={`mode-${mode}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-6 w-6 ${info.color} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base">{info.name}</h3>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{info.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Max: {info.maxPlayers} players
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({room.players.length}/{room.maxPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {room.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                        data-testid={`player-${player.id}`}
                      >
                        <CustomAvatarDisplay avatar={player.customAvatar || DEFAULT_AVATAR} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">
                              {player.id === playerId ? "You" : player.name}
                            </p>
                            {player.id === room.hostId && (
                              <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          {player.id === room.hostId && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Host
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <Button
                  onClick={handleStartGame}
                  disabled={!isHost || room.players.length < 2 || !isConnected}
                  className="w-full h-12 text-lg font-semibold"
                  data-testid="button-start-game"
                >
                  Start Game
                </Button>

                {!isHost && (
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Waiting for host to start the game...
                  </p>
                )}
                {isHost && room.players.length < 2 && (
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Need at least 2 players to start
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
