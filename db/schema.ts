import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Avatar customization fields
  avatarGender: text("avatar_gender").notNull().default("male"),
  avatarEyes: text("avatar_eyes").notNull().default("normal"),
  avatarMouth: text("avatar_mouth").notNull().default("smile"),
  avatarHairStyle: text("avatar_hair_style").notNull().default("short"),
  avatarHairColor: text("avatar_hair_color").notNull().default("#3b2414"),
  avatarShirtColor: text("avatar_shirt_color").notNull().default("#22c55e"),
  avatarPantsColor: text("avatar_pants_color").notNull().default("#3b82f6"),
  avatarSkinTone: text("avatar_skin_tone").notNull().default("#f5c6a5"),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
