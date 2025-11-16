import { z } from "zod";

// Game Modes
export const GameMode = {
  CLASSIC: "classic",
  DOUBLE_DRAW: "double_draw",
  BLITZ: "blitz",
  RANDOMIZED: "randomized",
  MEGA: "mega",
} as const;

export type GameMode = typeof GameMode[keyof typeof GameMode];

// Avatar IDs (12 unique avatars)
export const AVATARS = [
  "avatar-1", "avatar-2", "avatar-3", "avatar-4",
  "avatar-5", "avatar-6", "avatar-7", "avatar-8",
  "avatar-9", "avatar-10", "avatar-11", "avatar-12"
] as const;

export type AvatarId = typeof AVATARS[number];

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(20),
  avatar: z.enum(AVATARS),
  score: z.number().default(0),
  hasGuessed: z.boolean().default(false),
});

export type Player = z.infer<typeof playerSchema>;

// Room schema
export const roomSchema = z.object({
  code: z.string().length(6),
  hostId: z.string(),
  gameMode: z.enum([GameMode.CLASSIC, GameMode.DOUBLE_DRAW, GameMode.BLITZ, GameMode.RANDOMIZED, GameMode.MEGA]),
  players: z.array(playerSchema),
  maxPlayers: z.number().min(2).max(50),
  isStarted: z.boolean().default(false),
});

export type Room = z.infer<typeof roomSchema>;

// Drawing data
export const drawingDataSchema = z.object({
  type: z.enum(["draw", "clear"]),
  color: z.string().optional(),
  size: z.number().optional(),
  fromX: z.number().optional(),
  fromY: z.number().optional(),
  toX: z.number().optional(),
  toY: z.number().optional(),
  drawerId: z.string().optional(),
});

export type DrawingData = z.infer<typeof drawingDataSchema>;

// Chat message
export const messageSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  playerName: z.string(),
  content: z.string(),
  isCorrect: z.boolean().default(false),
  isSystem: z.boolean().default(false),
  timestamp: z.number(),
});

export type Message = z.infer<typeof messageSchema>;

// Game state
export const gameStateSchema = z.object({
  currentRound: z.number(),
  totalRounds: z.number(),
  currentWord: z.string(),
  wordDisplay: z.string(), // Blanks for guessers, full word for drawer
  drawerIds: z.array(z.string()), // Array to support Double Draw mode
  timeRemaining: z.number(),
  roundDuration: z.number(),
  isRoundActive: z.boolean(),
  currentBrushModifier: z.object({
    color: z.string().optional(),
    size: z.number().optional(),
    mirror: z.boolean().optional(),
  }).optional(),
});

export type GameState = z.infer<typeof gameStateSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join_room"),
    roomCode: z.string(),
    playerName: z.string(),
    avatar: z.enum(AVATARS),
  }),
  z.object({
    type: z.literal("join_random_room"),
    playerName: z.string(),
    avatar: z.enum(AVATARS),
  }),
  z.object({
    type: z.literal("rejoin_room"),
    roomCode: z.string(),
    playerId: z.string(),
  }),
  z.object({
    type: z.literal("create_room"),
    playerName: z.string(),
    avatar: z.enum(AVATARS),
    gameMode: z.enum([GameMode.CLASSIC, GameMode.DOUBLE_DRAW, GameMode.BLITZ, GameMode.RANDOMIZED, GameMode.MEGA]),
  }),
  z.object({
    type: z.literal("start_game"),
    roomCode: z.string(),
  }),
  z.object({
    type: z.literal("draw"),
    roomCode: z.string(),
    drawingData: drawingDataSchema,
  }),
  z.object({
    type: z.literal("chat"),
    roomCode: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("update_avatar"),
    roomCode: z.string(),
    avatar: z.enum(AVATARS),
  }),
]);

export type WsMessage = z.infer<typeof wsMessageSchema>;

// Server response types
export type ServerMessage =
  | { type: "room_created"; room: Room; playerId: string }
  | { type: "room_joined"; room: Room; playerId: string }
  | { type: "room_updated"; room: Room }
  | { type: "game_started"; gameState: GameState }
  | { type: "game_state_updated"; gameState: GameState }
  | { type: "drawing_update"; drawingData: DrawingData }
  | { type: "chat_message"; message: Message }
  | { type: "round_end"; correctWord: string; scores: Record<string, number> }
  | { type: "game_end"; finalScores: Record<string, number>; winner: string }
  | { type: "brush_modified"; modifier: { color?: string; size?: number; mirror?: boolean } }
  | { type: "error"; message: string };
