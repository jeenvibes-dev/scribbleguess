import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { customAvatarSchema } from "@shared/avatarSchema";

const router = Router();

let db: any = null;
let users: any = null;
let eq: any = null;

// Try to import database, but don't fail if DATABASE_URL is not set
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

// Middleware to check if database is available
const requireDb = (req: Request, res: Response, next: any) => {
  if (!db || !users) {
    return res.status(503).json({ message: "Authentication service unavailable. Database not configured." });
  }
  next();
};

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

// Get current user
router.get("/me", requireDb, async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
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
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update avatar
const updateAvatarSchema = z.object({
  avatar: customAvatarSchema,
});

router.post("/update-avatar", requireDb, async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;

  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const { avatar } = updateAvatarSchema.parse(req.body);

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

export default router;
