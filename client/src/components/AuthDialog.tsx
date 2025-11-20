import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function AuthDialog({ onClose }: { onClose?: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dbUnavailable, setDbUnavailable] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(username, password);
      } else {
        await signIn(username, password);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Authentication failed";
      if (errorMsg.includes("unavailable") || errorMsg.includes("Database not configured")) {
        setDbUnavailable(true);
        setError("Database not configured");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-emerald-600/20 shadow-xl">
        <CardHeader className="space-y-1">
          {dbUnavailable ? (
            <>
              <CardTitle className="text-2xl font-bold text-center">
                Database Not Configured
              </CardTitle>
              <CardDescription className="text-center">
                User accounts require a database connection
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-bold text-center">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp
                  ? "Sign up to save your custom avatar"
                  : "Sign in to access your saved avatar"}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {dbUnavailable ? (
            <div className="space-y-4">
              <Alert className="border-emerald-600/20">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Good news!</strong> You can still use DoodlRush without an account.
                  Your custom avatar will be saved in your browser.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold">To enable user accounts:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Get a free database at <a href="https://neon.tech" target="_blank" className="text-emerald-600 hover:underline">neon.tech</a></li>
                  <li>Add DATABASE_URL to your .env file</li>
                  <li>Run: <code className="bg-muted px-1 py-0.5 rounded">npm run db:push</code></li>
                  <li>Restart the server</li>
                </ol>
                <p className="text-xs mt-3">
                  See <code className="bg-muted px-1 py-0.5 rounded">DATABASE_SETUP.md</code> for details
                </p>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Continue Without Account
              </Button>
            </div>
          ) : (
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
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                className="border-emerald-600/20 focus:border-emerald-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-emerald-600/20 focus:border-emerald-600"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-sm text-emerald-600 hover:text-emerald-700 underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
