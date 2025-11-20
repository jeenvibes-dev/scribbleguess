import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthDialog({ onClose }: { onClose?: () => void }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { guestSignUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const isReturning = await guestSignUp(username);
      
      if (isReturning) {
        toast({
          title: "Welcome back!",
          description: "Your saved avatar has been loaded.",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Your avatar will be saved automatically.",
        });
      }
      
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-emerald-600/20 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-600" />
            <CardTitle className="text-2xl font-bold text-center">
              Enter Your Username
            </CardTitle>
          </div>
          <CardDescription className="text-center">
            New user? We'll create an account. Returning? We'll load your saved avatar!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                className="border-emerald-600/20 focus:border-emerald-600"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                3-20 characters • Your avatar is saved forever
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading || username.length < 3}
            >
              {isLoading ? "Loading..." : "Continue"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              No password • Works offline • Saves automatically
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
