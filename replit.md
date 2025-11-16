# ScribbleGuess - Multiplayer Drawing Game

## Overview

ScribbleGuess is a real-time multiplayer drawing and guessing game inspired by Skribbl.io and Gartic Phone. Players join rooms where one or more players draw a secret word while others attempt to guess it. The game features multiple game modes including Classic (traditional 60s rounds), Double Draw (two simultaneous drawers), Blitz (fast 15s rounds), Randomized (random brush modifiers), and Mega Mode (1 drawer with up to 50 guessers).

The application uses a React frontend with TypeScript, Express backend with WebSocket support for real-time communication, and is designed to be deployed on Replit.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**React with TypeScript SPA**: The client is built as a single-page application using React 18 with TypeScript, leveraging Wouter for routing and TanStack Query for state management.

**UI Component System**: Uses shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling. This provides a consistent, accessible component library with the "New York" style variant. The design system follows playful, social-first principles with rounded corners, vibrant gradients for avatars, and clear visual hierarchy.

**Real-time Canvas System**: Custom HTML5 Canvas implementation for the drawing functionality with support for different brush sizes, colors, and drawing modes. The canvas uses refs and imperative handles to synchronize drawing data across clients.

**Page Structure**:
- **Home**: Player creation and room join/create interface
- **Lobby**: Pre-game room with avatar selection, game mode configuration, and player ready status
- **Game**: Split-panel layout with drawing canvas (65% width) and sidebar (35% width) containing timer, scoreboard, and chat

**Design Token System**: Tailwind configuration extends the base theme with custom CSS variables for consistent theming, including specialized border colors, elevation shadows, and a comprehensive color palette supporting both light and dark modes.

### Backend Architecture

**Express HTTP Server**: Serves the built React application and handles initial connection setup. Uses Vite in development mode for HMR and esbuild for production bundling.

**WebSocket Server**: Implements real-time bidirectional communication using the `ws` library. All game state changes, drawing events, chat messages, and player actions are transmitted through WebSocket messages with a strongly-typed message protocol defined in shared schemas.

**In-Memory Storage Pattern**: Uses a `MemStorage` class that implements the `IStorage` interface, maintaining room state, game state, and messages in Map structures. This approach was chosen for simplicity and low latency, with the understanding that state is ephemeral and lost on server restart. The storage layer is abstracted to allow future database integration.

**Game Logic Layer**: Centralized game logic in `server/gameLogic.ts` handles:
- Word selection from a predefined word list
- Round progression and turn rotation
- Score calculation based on guess timing
- Game mode-specific rules (double drawers, blitz timing, randomized modifiers)
- Word display masking (showing first/last letters only to guessers)

**Session Management**: Player identity is maintained through randomly generated UUIDs assigned on room join/create. Room codes are 6-character uppercase strings. No authentication system is implemented as the game is designed for casual, ephemeral sessions.

### State Synchronization Strategy

**Client State**: React components maintain local UI state (input values, modal visibility) while game-critical state (player list, scores, current drawer, game phase) is received from the server via WebSocket and stored in component state.

**Server as Source of Truth**: All game state mutations happen server-side. Client actions (drawing, guessing, ready status) are sent as messages to the server, which validates, updates state, and broadcasts changes to all connected clients in the room.

**Optimistic Canvas Updates**: Drawing operations are rendered immediately on the drawer's canvas for responsiveness, then broadcast to other clients. This prevents perceived lag while maintaining eventual consistency.

### Data Schema

**Type Safety**: Shared TypeScript schemas defined in `shared/schema.ts` using Zod for runtime validation. These schemas are used on both client and server to ensure message contract compliance.

**Core Entities**:
- **Player**: ID, name, avatar (emoji-based, 12 variants), score, guess status
- **Room**: Code, host ID, game mode, player list, max players, started status
- **GameState**: Current round, total rounds, word, word display, drawer IDs, time remaining, correct guessers
- **DrawingData**: Draw actions (coordinates, color, size) and clear commands
- **Message**: Chat messages with sender info and timestamp

**Game Modes Enum**: Five game modes with distinct rules encoded in the GameMode enum, affecting round duration, drawer count, and special mechanics.

### WebSocket Message Protocol

**Bidirectional Message Types**:
- **Client → Server**: create_room, join_room, start_game, draw, chat, guess, ready_toggle, leave_room
- **Server → Client**: room_created, room_joined, room_updated, game_started, drawing, new_message, correct_guess, round_end, game_end, player_left, error

**Message Flow Example**: When a player guesses correctly, the client sends a "guess" message, the server validates it against the current word, updates the GameState to mark the player as having guessed, calculates score based on time remaining, and broadcasts "correct_guess" to all clients along with an updated "room_updated" message containing new scores.

### Build and Deployment

**Development**: Vite dev server with HMR, TypeScript checking, and Replit-specific plugins for error overlays and dev banners.

**Production Build**: 
1. Vite builds the React app to `dist/public`
2. esbuild bundles the Express server to `dist/index.js` with ESM format
3. Server serves static files from the built client directory
4. WebSocket server runs on the same HTTP server instance

**Environment Configuration**: Uses NODE_ENV to switch between development and production modes. Expects DATABASE_URL environment variable (configured in drizzle.config.ts) though the current implementation uses in-memory storage.

## External Dependencies

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive set of unstyled, accessible React components (accordion, avatar, dialog, dropdown, popover, etc.) forming the foundation of the UI component system
- **shadcn/ui**: Pre-styled component patterns built on Radix UI, configured via `components.json`
- **Tailwind CSS**: Utility-first CSS framework for styling with custom configuration extending the base theme
- **class-variance-authority**: Variant-based component styling utility
- **lucide-react**: Icon library providing consistent iconography

### State Management and Data Fetching
- **@tanstack/react-query**: Async state management and server data caching
- **wouter**: Lightweight client-side routing library (alternative to React Router)

### Real-time Communication
- **ws**: WebSocket library for Node.js server implementation
- **WebSocket API**: Browser-native WebSocket client for real-time bidirectional communication

### Form Handling and Validation
- **react-hook-form**: Form state management and validation
- **@hookform/resolvers**: Validation resolver for integrating Zod with react-hook-form
- **zod**: TypeScript-first schema validation library
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas

### Database and ORM
- **drizzle-orm**: TypeScript ORM for SQL databases
- **drizzle-kit**: Schema migration and management tool
- **@neondatabase/serverless**: Neon Postgres serverless driver (configured but not actively used in current in-memory implementation)
- **connect-pg-simple**: PostgreSQL session store for Express (prepared for future session persistence)

### UI Utilities
- **embla-carousel-react**: Touch-friendly carousel component for avatar selection
- **cmdk**: Command menu component (Command+K style interface)
- **date-fns**: Date manipulation and formatting utilities
- **clsx + tailwind-merge**: Utility for conditional className composition

### Development and Build Tools
- **Vite**: Frontend build tool and dev server with React plugin
- **@vitejs/plugin-react**: Vite plugin for React Fast Refresh
- **esbuild**: Fast JavaScript/TypeScript bundler for server code
- **TypeScript**: Type system and compiler
- **tsx**: TypeScript execution engine for Node.js (development runtime)
- **@replit/vite-plugin-***: Replit-specific Vite plugins for runtime error overlay, cartographer, and dev banners

### Fonts
- **Poppins**: Primary sans-serif font (Google Fonts) for headers and UI elements
- **Courier New**: Monospace font for room codes
- **DM Sans, Geist Mono, Architects Daughter, Fira Code**: Additional font options referenced in HTML