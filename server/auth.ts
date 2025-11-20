import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { customAvatarSchema, DEFAULT_AVATAR } from "@shared/avatarSchema";
import { createGuestUser, getGuestUser, updateGuestUserAvatar, findGuestUserByUsername } from "./guestAuth";

const router = Router();

let db: any = null;
let users: any = null;
let eq: any = null;

// Try to import database, but don't fail if DATABASE_URL is not set
async function initializeDatabase() {
  try {
    if (process.env.DATABASE_URL) {
      const dbModule = await import("../db/index.js");
      const schemaModule = await import("../db/schema.js");
      const drizzleModule = await import("drizzle-orm");
      db = dbModule.db;
      users = schemaModule.users;
      eq = drizzleModule.eq;
    }
  } catch (error) {
    console.warn("Database not configured. Auth features will be disabled.");
  }
}

// Initialize database on module load
initializeDatabase();

// Middleware to check if database is available
const requireDb = (req: Request, res: Response, next: any) => {
  if (!db || !users) {
    return res.status(503).json({ message: "Authentication service unavailable. Database not configured." });
  }
  next();
};

// Guest account sign up/sign in (no database needed)
const guestSignupSchema = z.object({
  username: z.string().min(3).max(20),
});

router.post("/guest-signup", async (req: Request, res: Response) => {
  try {
    const { username } = guestSignupSchema.parse(req.body);

    // Check if user already exists
    let guestUser = findGuestUserByUsername(username);
    
    if (guestUser) {
      // User exists - sign them in with their saved avatar
      (req.session as any).userId = guestUser.id;
      (req.session as any).username = guestUser.username;
      (req.session as any).isGuest = true;

      return res.json({
        id: guestUser.id,
        username: guestUser.username,
        avatar: guestUser.avatar,
        isGuest: true,
        returning: true,
      });
    }

    // Create new guest user with default avatar
    guestUser = createGuestUser(username, DEFAULT_AVATAR);

    // Set session
    (req.session as any).userId = guestUser.id;
    (req.session as any).username = guestUser.username;
    (req.session as any).isGuest = true;

    res.json({
      id: guestUser.id,
      username: guestUser.username,
      avatar: guestUser.avatar,
      isGuest: true,
      returning: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Guest signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Password hashing (simple for now - in production use bcrypt)
function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Sign up
const signupSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

router.post("/signup", requireDb, async (req: Request, res: Response) => {
  try {
    const { username, password } = signupSchema.parse(req.body);

    // Check if username exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Create new user
    const userId = randomUUID();
    const hashedPassword = hashPassword(password);

    const [newUser] = await db.insert(users).values({
      id: userId,
      username,
      password: hashedPassword,
    }).returning();

    // Set session
    (req.session as any).userId = newUser.id;
    (req.session as any).username = newUser.username;

    res.json({
      id: newUser.id,
      username: newUser.username,
      avatar: {
        gender: newUser.avatarGender,
        eyes: newUser.avatarEyes,
        mouth: newUser.avatarMouth,
        hairStyle: newUser.avatarHairStyle,
        hairColor: newUser.avatarHairColor,
        shirtColor: newUser.avatarShirtColor,
        pantsColor: newUser.avatarPantsColor,
        skinTone: newUser.avatarSkinTone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Sign in
const signinSchema = z.object({
  username: z.string(),
  password: z.string(),
});

router.post("/signin", requireDb, async (req: Request, res: Response) => {
  try {
    const { username, password } = signinSchema.parse(req.body);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Set session
    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;

    res.json({
      id: user.id,
      username: user.username,
      avatar: {
        gender: user.avatarGender,
        eyes: user.avatarEyes,
        mouth: user.avatarMouth,
        hairStyle: user.avatarHairStyle,
        hairColor: user.avatarHairColor,
        shirtColor: user.avatarShirtColor,
        pantsColor: user.avatarPantsColor,
        skinTone: user.avatarSkinTone,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Signin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Sign out
router.post("/signout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not sign out" });
    }
    res.json({ message: "Signed out successfully" });
  });
});

// Get current user (works for both guest and database users)
router.get("/me", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const isGuest = (req.session as any).isGuest;

  if (!userId) {
    return res.status(200).json({ user: null });
  }

  try {
    // Check if it's a guest user
    if (isGuest) {
      const guestUser = getGuestUser(userId);
      if (!guestUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({
        id: guestUser.id,
        username: guestUser.username,
        avatar: guestUser.avatar,
        isGuest: true,
      });
    }

    // Database user
    if (!db || !users) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      avatar: {
        gender: user.avatarGender,
        eyes: user.avatarEyes,
        mouth: user.avatarMouth,
        hairStyle: user.avatarHairStyle,
        hairColor: user.avatarHairColor,
        shirtColor: user.avatarShirtColor,
        pantsColor: user.avatarPantsColor,
        skinTone: user.avatarSkinTone,
      },
      isGuest: false,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update avatar (works for both guest and database users)
const updateAvatarSchema = z.object({
  avatar: customAvatarSchema,
});

router.post("/update-avatar", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const isGuest = (req.session as any).isGuest;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const { avatar } = updateAvatarSchema.parse(req.body);

    // Update guest user avatar
    if (isGuest) {
      const updated = updateGuestUserAvatar(userId, avatar);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ message: "Avatar updated successfully", avatar });
    }

    // Update database user avatar
    if (!db || !users) {
      return res.status(503).json({ message: "Database not available" });
    }

    await db.update(users)
      .set({
        avatarGender: avatar.gender,
        avatarEyes: avatar.eyes,
        avatarMouth: avatar.mouth,
        avatarHairStyle: avatar.hairStyle,
        avatarHairColor: avatar.hairColor,
        avatarShirtColor: avatar.shirtColor,
        avatarPantsColor: avatar.pantsColor,
        avatarSkinTone: avatar.skinTone,
      })
      .where(eq(users.id, userId));

    res.json({ message: "Avatar updated successfully", avatar });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid avatar data", errors: error.errors });
    }
    console.error("Update avatar error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update username
const updateUsernameSchema = z.object({
  username: z.string().min(3).max(20),
});

router.post("/update-username", async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  const isGuest = (req.session as any).isGuest;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const { username } = updateUsernameSchema.parse(req.body);

    // Check if username is already taken
    const existing = findGuestUserByUsername(username);
    if (existing && existing.id !== userId) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Update guest user username
    if (isGuest) {
      const { updateGuestUserUsername } = await import("./guestAuth.js");
      const updated = updateGuestUserUsername(userId, username);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      (req.session as any).username = username;
      return res.json({ message: "Username updated successfully", username });
    }

    // Database users not supported yet
    return res.status(400).json({ message: "Username updates not supported for database users" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Update username error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
