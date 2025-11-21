import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shuffle, Save, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { type CustomAvatar, DEFAULT_AVATAR, GENDERS, EYE_STYLES, MOUTH_STYLES, HAIR_STYLES, SKIN_TONES } from "@shared/avatarSchema";
import { useToast } from "@/hooks/use-toast";
import { AvatarCustomizer } from "@/components/AvatarCustomizer";

export default function CustomizeAvatar() {
  const [, setLocation] = useLocation();
  const { user, updateAvatar } = useAuth();
  const { toast } = useToast();
  const [customAvatar, setCustomAvatar] = useState<CustomAvatar>(DEFAULT_AVATAR);
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomAvatar(user.avatar);
      setUsername(user.username);
    } else {
      // Redirect to home if not logged in
      setLocation("/");
    }
  }, [user, setLocation]);

  // Track changes to avatar or username
  useEffect(() => {
    if (!user) return;
    
    const avatarChanged = JSON.stringify(customAvatar) !== JSON.stringify(user.avatar);
    const usernameChanged = username !== user.username;
    
    setHasUnsavedChanges(avatarChanged || usernameChanged);
  }, [customAvatar, username, user]);

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleRandomize = () => {
    const randomGender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const randomEyes = EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)];
    const randomMouth = MOUTH_STYLES[Math.floor(Math.random() * MOUTH_STYLES.length)];
    const randomHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
    const randomSkinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    
    // Random colors
    const randomHairColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    const randomShirtColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    const randomPantsColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

    const randomAvatar: CustomAvatar = {
      gender: randomGender,
      eyes: randomEyes,
      mouth: randomMouth,
      hairStyle: randomHairStyle,
      hairColor: randomHairColor,
      shirtColor: randomShirtColor,
      pantsColor: randomPantsColor,
      skinTone: randomSkinTone,
    };

    setCustomAvatar(randomAvatar);
    toast({
      title: "Avatar randomized!",
      description: "Click Save to keep this look.",
    });
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update username if changed
      if (username !== user?.username) {
        const response = await fetch("/api/auth/update-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to update username");
        }
      }

      await updateAvatar(customAvatar);
      setHasUnsavedChanges(false);
      toast({
        title: "Changes saved!",
        description: "Your profile has been updated successfully.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
        setLocation("/");
      }
    } else {
      setLocation("/");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Customize Avatar & Account</h1>
            <p className="text-muted-foreground">Personalize your profile</p>
          </div>
        </div>

        {/* Account Info */}
        <Card className="border-emerald-600/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your username and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                placeholder="Enter your username"
              />
              <p className="text-xs text-muted-foreground">
                You can change your username anytime
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Customization */}
        <Card className="border-emerald-600/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Avatar Customization</CardTitle>
                <CardDescription>Design your unique character</CardDescription>
              </div>
              <Button
                onClick={handleRandomize}
                variant="outline"
                size="sm"
                className="border-emerald-600/20 hover:bg-emerald-600/10"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Randomize
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AvatarCustomizer 
              avatar={customAvatar} 
              onAvatarChange={setCustomAvatar}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 text-lg font-semibold"
          >
            <Save className="h-5 w-5 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="h-12 px-8"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
