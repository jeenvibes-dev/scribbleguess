import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paintbrush, Users, LogOut, User, Settings } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { type ServerMessage, type Room, GameMode } from "@shared/schema";
import { DEFAULT_AVATAR } from "@shared/avatarSchema";
import { useToast } from "@/hooks/use-toast";
import { CustomAvatarDisplay } from "@/components/CustomAvatarDisplay";
import AuthDialog from "@/components/AuthDialog";

const STORAGE_KEYS = {
  PLAYER_NAME: "doodlrush_player_name",
} as const;

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Load user data
  useEffect(() => {
    if (user) {
      setPlayerName(user.username);
    } else {
      const savedName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
      if (savedName) {
        setPlayerName(savedName);
      }
    }
  }, [user]);

  // Save player name to localStorage
  const handleNameChange = (name: string) => {
    setPlayerName(name);
    if (name.trim() && !user) {
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed Out",
      description: "You've been signed out successfully",
    });
  };

  const handleMessage = useCallback((message: ServerMessage) => {
    if (message.type === "room_created") {
      setPlayerId(message.playerId);
      setRoom(message.room);
      localStorage.setItem(`room_${message.room.code}`, JSON.stringify(message.room));
      localStorage.setItem(`player_${message.room.code}`, message.playerId);
      localStorage.setItem(`avatar_${message.room.code}`, JSON.stringify(user?.avatar || DEFAULT_AVATAR));
      setLocation(`/lobby?room=${message.room.code}&playerId=${message.playerId}`);
    } else if (message.type === "room_joined") {
      setPlayerId(message.playerId);
      setRoom(message.room);
      localStorage.setItem(`room_${message.room.code}`, JSON.stringify(message.room));
      localStorage.setItem(`player_${message.room.code}`, message.playerId);
      localStorage.setItem(`avatar_${message.room.code}`, JSON.stringify(user?.avatar || DEFAULT_AVATAR));
      setLocation(`/lobby?room=${message.room.code}&playerId=${message.playerId}`);
    } else if (message.type === "error") {
      toast({
        title: "Error",
        description: message.message,
        variant: "destructive",
      });
    }
  }, [setLocation, toast, user]);

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
        customAvatar: user?.avatar,
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
        customAvatar: user?.avatar,
      });
    }
  };

  // Show loading state while auth is being checked (AFTER all hooks)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE1] flex items-center justify-center">
        <div className="text-center space-y-4">
          <img 
            src="https://cdn.leonardo.ai/users/1c864942-3f25-4c2c-959b-c2987c1629f1/generations/519b6a03-a2e9-431c-b7ff-9a4fbc7c15ff/segments/4:4:1/Lucid_Origin_A_vibrant_green_logo_featuring_the_word_DoodlRush_3.jpg" 
            alt="DoodlRush" 
            className="h-56 w-auto mx-auto"
            style={{
              clipPath: 'inset(20% 0 20% 0)',
              objectFit: 'cover'
            }}
          />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5EFE1] flex items-center justify-center p-4">
      {showAuthDialog && !user && <AuthDialog onClose={() => setShowAuthDialog(false)} />}
      
      <div className="w-full max-w-6xl space-y-2">
        <div className="text-center space-y-0 animate-slide-in">
          <div className="flex items-center justify-center -mt-8">
            <img 
              src="https://cdn.leonardo.ai/users/1c864942-3f25-4c2c-959b-c2987c1629f1/generations/519b6a03-a2e9-431c-b7ff-9a4fbc7c15ff/segments/4:4:1/Lucid_Origin_A_vibrant_green_logo_featuring_the_word_DoodlRush_3.jpg" 
              alt="DoodlRush" 
              className="h-56 md:h-72 w-auto"
              style={{
                clipPath: 'inset(20% 0 20% 0)',
                objectFit: 'cover'
              }}
            />
          </div>
          <p className="text-xl text-muted-foreground font-medium -mt-4">
            Draw, Guess, and Have Fun with Friends!
          </p>
          {!isConnected && (
            <p className="text-sm text-yellow-600">Connecting to server...</p>
          )}
          
          {/* Auth Status */}
          <div className="flex items-center justify-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-emerald-600/10 px-4 py-2 rounded-full border border-emerald-600/20">
                <User className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">{user.username}</span>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 ml-2"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthDialog(true)}
                variant="outline"
                size="sm"
                className="border-emerald-600/20 hover:bg-emerald-600/10 font-bold"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In to Play
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          {user && (
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle className="text-center">Your Avatar</CardTitle>
                <CardDescription className="text-center">Customize your appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <CustomAvatarDisplay avatar={user.avatar} size="lg" />
                  <Button
                    onClick={() => setLocation("/customize")}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize Avatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                    disabled={!!user}
                  />
                  {user && (
                    <p className="text-xs text-muted-foreground text-center">
                      Using your account username
                    </p>
                  )}
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
