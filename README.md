# ScribbleGuess 🎨

A real-time multiplayer drawing and guessing game inspired by Skribbl.io, built with React, TypeScript, Express, and WebSockets.

## 🎮 Game Modes

- **Classic** - Traditional 60-second rounds with one drawer
- **Double Draw** - Two players draw simultaneously 
- **Blitz** - Fast-paced 15-second rounds
- **Randomized** - Random brush modifiers for extra challenge
- **Mega Mode** - Scale up to 50 players with one drawer

## ✨ Features

- Real-time multiplayer using WebSockets
- 12 unique avatar options
- Room-based gameplay with shareable room codes
- "Join Random Room" for quick matchmaking
- Dynamic scoring system based on guess speed
- Live chat with guess detection
- Host controls for game mode selection
- Responsive canvas drawing with multiple brush sizes and colors

## 🚀 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Wouter (routing)
- TanStack Query (state management)
- shadcn/ui + Radix UI (components)
- Tailwind CSS (styling)
- HTML5 Canvas (drawing)

**Backend:**
- Express (HTTP server)
- WebSocket (`ws` library)
- In-memory storage (MemStorage)
- TypeScript

**Build Tools:**
- Vite (frontend bundler)
- esbuild (server bundler)

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🎯 How to Play

1. **Create or Join Room:**
   - Enter your name and create a new room
   - Share the room code with friends
   - Or use "Join Random Room" to find an available game

2. **Lobby:**
   - Choose your avatar
   - Host selects game mode
   - Mark yourself ready
   - Host starts when all players are ready

3. **Game:**
   - Drawer gets a secret word and draws it
   - Guessers type their guesses in chat
   - Points awarded based on speed of correct guess
   - Rounds rotate until all players have drawn

## 📁 Project Structure

```
├── client/              # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       ├── contexts/    # WebSocket context
│       └── hooks/       # Custom hooks
├── server/              # Express backend
│   ├── routes.ts        # WebSocket handlers
│   ├── gameLogic.ts     # Game rules & scoring
│   └── storage.ts       # In-memory storage
├── shared/              # Shared types
│   └── schema.ts        # TypeScript schemas
└── scripts/             # Utility scripts
```

## 🎨 Game Modes Details

### Classic Mode
- 60 seconds per round
- One drawer per round
- 3 rounds total
- Up to 12 players

### Double Draw Mode
- Two players draw the same word simultaneously
- Requires 3+ players
- Falls back to single drawer with <3 players

### Blitz Mode
- Fast 15-second rounds
- Quick reflexes required
- Great for short gaming sessions

### Randomized Mode
- Brush settings change randomly during drawing
- Adds unpredictability and challenge

### Mega Mode
- Up to 50 players
- One drawer with massive audience
- Perfect for streaming or large groups

## 🔧 Environment Variables

- `SESSION_SECRET` - Session encryption key (auto-configured on Replit)
- `NODE_ENV` - Set to "production" for production builds

## 📝 License

MIT

## 🙏 Acknowledgments

Inspired by Skribbl.io and Gartic Phone.

---

Built with ❤️ using Replit
