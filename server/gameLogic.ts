import { type Room, type GameState, type Player, GameMode } from "@shared/schema";

const WORDS = [
  "RAINBOW", "SUNSET", "MOUNTAIN", "OCEAN", "FOREST", "CASTLE", "DRAGON",
  "UNICORN", "PIZZA", "GUITAR", "ROCKET", "BUTTERFLY", "LIGHTHOUSE", "TREASURE",
  "DINOSAUR", "ELEPHANT", "PENGUIN", "FLAMINGO", "AIRPLANE", "BICYCLE",
  "SKATEBOARD", "SNOWFLAKE", "CAMPFIRE", "WATERFALL", "VOLCANO", "ISLAND",
  "ROBOT", "SPACESHIP", "CROWN", "DIAMOND", "BALLOON", "CUPCAKE", "SANDWICH",
  "COOKIE", "CARROT", "STRAWBERRY", "BANANA", "PINEAPPLE", "SUNFLOWER",
  "CACTUS", "MUSHROOM", "RAINBOW", "STAR", "MOON", "CLOUD", "LIGHTNING",
  "SNOWMAN", "IGLOO", "TENT", "BOAT", "ANCHOR", "COMPASS", "TELESCOPE",
  "CAMERA", "BOOK", "PENCIL", "PAINTBRUSH", "SCISSORS", "UMBRELLA", "GLASSES",
  "WATCH", "KEYS", "BACKPACK", "LAPTOP", "PHONE", "HEADPHONES", "MICROPHONE",
  "FOOTBALL", "BASKETBALL", "TENNIS", "BASEBALL", "SOCCER", "BOWLING",
  "CHESS", "PUZZLE", "KITE", "FIREWORKS", "TROPHY", "MEDAL", "FLAG",
  "HEART", "PEACE", "SMILE", "HANDSHAKE", "THUMBSUP", "GIFT", "PARTY",
  "CAKE", "CANDLE", "MUSIC", "DANCE", "SING", "CLAP", "WAVE", "JUMP",
];

export function getRandomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export function createWordDisplay(word: string, isDrawer: boolean): string {
  if (isDrawer) return word;
  return word.split("").map((char, i) => {
    if (char === " ") return " ";
    if (i === 0 || i === word.length - 1) return char;
    return "_";
  }).join(" ");
}

export function initializeGameState(room: Room): GameState {
  const word = getRandomWord();
  const totalRounds = room.gameMode === GameMode.BLITZ ? 10 : 10;
  const roundDuration = room.gameMode === GameMode.BLITZ ? 15 : 60;
  
  let drawerIds: string[];
  if (room.gameMode === GameMode.DOUBLE_DRAW && room.players.length >= 3) {
    drawerIds = room.players.slice(0, 2).map(p => p.id);
  } else {
    drawerIds = [room.players[0].id];
  }

  return {
    currentRound: 1,
    totalRounds,
    currentWord: word,
    wordDisplay: createWordDisplay(word, false),
    drawerIds,
    timeRemaining: roundDuration,
    roundDuration,
    isRoundActive: true,
  };
}

export function getNextDrawers(room: Room, currentDrawerIds: string[]): string[] {
  if (room.gameMode === GameMode.DOUBLE_DRAW && room.players.length >= 3) {
    const currentIndex = room.players.findIndex(p => p.id === currentDrawerIds[0]);
    const nextIndex = (currentIndex + 2) % room.players.length;
    const nextNextIndex = (nextIndex + 1) % room.players.length;
    return [room.players[nextIndex].id, room.players[nextNextIndex]?.id || room.players[0].id];
  } else {
    const currentIndex = room.players.findIndex(p => p.id === currentDrawerIds[0]);
    const nextIndex = (currentIndex + 1) % room.players.length;
    return [room.players[nextIndex].id];
  }
}

export function checkGuess(guess: string, word: string): boolean {
  return guess.trim().toUpperCase() === word.toUpperCase();
}

export function calculateScore(timeRemaining: number, roundDuration: number, isDrawer: boolean): number {
  if (isDrawer) {
    return 50;
  }
  const baseScore = 100;
  const timeBonus = Math.floor((timeRemaining / roundDuration) * 100);
  return baseScore + timeBonus;
}

export function getRandomBrushModifier(): { color?: string; size?: number; mirror?: boolean } {
  const modifiers = [
    { color: "#FF0000" },
    { color: "#00FF00" },
    { color: "#0000FF" },
    { color: "#FFFF00" },
    { color: "#FF00FF" },
    { size: 2 },
    { size: 10 },
    { size: 15 },
    { mirror: true },
    { mirror: false },
  ];
  return modifiers[Math.floor(Math.random() * modifiers.length)];
}

export function shouldApplyRandomModifier(gameMode: GameMode, elapsedTime: number): boolean {
  if (gameMode !== GameMode.RANDOMIZED) return false;
  return elapsedTime % 10 === 0 && elapsedTime > 0;
}
