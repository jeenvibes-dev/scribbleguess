import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { customAvatarSchema, type CustomAvatar, DEFAULT_AVATAR } from "@shared/avatarSchema";
import { z } from "zod";

interface User {
  id: string;
  username: string;
  avatar: CustomAvatar;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  guestSignUp: (username: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateAvatar: (avatar: CustomAvatar) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("AuthProvider rendering, isLoading:", isLoading, "user:", user);

  useEffect(() => {
    console.log("AuthProvider: calling checkAuth");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("checkAuth: starting");
    try {
      const response = await fetch("/api/auth/me");
      console.log("checkAuth: response status", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("checkAuth: data", data);
        if (data.user) {
          setUser(data.user);
        } else if (data.id) {
          // Handle old format (direct user object)
          setUser(data);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      console.log("checkAuth: setting isLoading to false");
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Sign in failed");
    }

    const data = await response.json();
    setUser(data);
  };

  const signUp = async (username: string, password: string) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Sign up failed");
    }

    const data = await response.json();
    setUser(data);
  };

  const guestSignUp = async (username: string) => {
    const response = await fetch("/api/auth/guest-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Guest sign up failed");
    }

    const data = await response.json();
    setUser(data);
    
    // Return whether this is a returning user
    return data.returning;
  };

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
  };

  const updateAvatar = async (avatar: CustomAvatar) => {
    const response = await fetch("/api/auth/update-avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar }),
    });

    if (!response.ok) {
      throw new Error("Failed to update avatar");
    }

    if (user) {
      setUser({ ...user, avatar });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, guestSignUp, signOut, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
