import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { CustomAvatar } from "@shared/avatarSchema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUEST_USERS_FILE = path.join(__dirname, "..", "data", "guest-users.json");

interface GuestUser {
  id: string;
  username: string;
  avatar: CustomAvatar;
  createdAt: number;
}

// In-memory storage for guest users
const guestUsers = new Map<string, GuestUser>();
const usernameToId = new Map<string, string>();

// Load guest users from file on startup
async function loadGuestUsers() {
  try {
    await fs.mkdir(path.dirname(GUEST_USERS_FILE), { recursive: true });
    const data = await fs.readFile(GUEST_USERS_FILE, "utf-8");
    const users = JSON.parse(data);
    for (const user of users) {
      guestUsers.set(user.id, user);
      usernameToId.set(user.username.toLowerCase(), user.id);
    }
    console.log(`Loaded ${guestUsers.size} guest users from storage`);
  } catch (error) {
    // File doesn't exist yet, that's okay
    console.log("No existing guest users found, starting fresh");
  }
}

// Save guest users to file
async function saveGuestUsers() {
  try {
    const users = Array.from(guestUsers.values());
    await fs.mkdir(path.dirname(GUEST_USERS_FILE), { recursive: true });
    await fs.writeFile(GUEST_USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Failed to save guest users:", error);
  }
}

// Initialize
loadGuestUsers();

export function findGuestUserByUsername(username: string): GuestUser | undefined {
  const userId = usernameToId.get(username.toLowerCase());
  if (!userId) return undefined;
  return guestUsers.get(userId);
}

export function createGuestUser(username: string, avatar: CustomAvatar): GuestUser {
  const id = randomUUID();
  const user: GuestUser = {
    id,
    username,
    avatar,
    createdAt: Date.now(),
  };
  guestUsers.set(id, user);
  usernameToId.set(username.toLowerCase(), id);
  saveGuestUsers(); // Save to disk
  return user;
}

export function getGuestUser(id: string): GuestUser | undefined {
  return guestUsers.get(id);
}

export function updateGuestUserAvatar(id: string, avatar: CustomAvatar): boolean {
  const user = guestUsers.get(id);
  if (user) {
    user.avatar = avatar;
    saveGuestUsers(); // Save to disk
    return true;
  }
  return false;
}

// Clean up old guest users (older than 30 days instead of 7)
setInterval(() => {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const idsToDelete: string[] = [];
  guestUsers.forEach((user, id) => {
    if (user.createdAt < thirtyDaysAgo) {
      idsToDelete.push(id);
      usernameToId.delete(user.username.toLowerCase());
    }
  });
  idsToDelete.forEach(id => guestUsers.delete(id));
  if (idsToDelete.length > 0) {
    saveGuestUsers();
    console.log(`Cleaned up ${idsToDelete.length} old guest users`);
  }
}, 24 * 60 * 60 * 1000); // Run cleanup daily
