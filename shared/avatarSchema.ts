import { z } from "zod";

// Avatar customization options
export const GENDERS = ["male", "female"] as const;
export type Gender = typeof GENDERS[number];

export const EYE_STYLES = [
  "normal",
  "happy",
  "wink",
  "closed",
  "surprised",
  "cool",
] as const;
export type EyeStyle = typeof EYE_STYLES[number];

export const MOUTH_STYLES = [
  "smile",
  "grin",
  "neutral",
  "open",
  "tongue",
  "mustache",
] as const;
export type MouthStyle = typeof MOUTH_STYLES[number];

export const HAIR_STYLES = [
  "short",
  "long",
  "curly",
  "bun",
  "ponytail",
  "spiky",
] as const;
export type HairStyle = typeof HAIR_STYLES[number];

export const SKIN_TONES = [
  "#FFE4C4", // Light
  "#FFD4A3", // Fair
  "#E6B87A", // Medium
  "#D4A574", // Tan
  "#C68E5C", // Brown
  "#8B5E3C", // Dark
] as const;
export type SkinTone = typeof SKIN_TONES[number];

export const customAvatarSchema = z.object({
  gender: z.enum(GENDERS),
  eyes: z.enum(EYE_STYLES),
  mouth: z.enum(MOUTH_STYLES),
  hairStyle: z.enum(HAIR_STYLES),
  hairColor: z.string(), // Hex color
  shirtColor: z.string(), // Hex color
  pantsColor: z.string(), // Hex color
  skinTone: z.enum(SKIN_TONES),
});

export type CustomAvatar = z.infer<typeof customAvatarSchema>;

export const DEFAULT_AVATAR: CustomAvatar = {
  gender: "male",
  eyes: "normal",
  mouth: "smile",
  hairStyle: "short",
  hairColor: "#654321",
  shirtColor: "#3B82F6",
  pantsColor: "#1F2937",
  skinTone: "#FFD4A3",
};
