# DoodlRush Authentication Setup

## Quick Start (Without Database)

The app works perfectly fine **without** a database! You can:
- Create and join game rooms
- Customize your avatar (saved in browser localStorage)
- Play all game modes

Your avatar will be saved in your browser's localStorage and persist across sessions.

## Setting Up User Accounts (Optional)

If you want users to have accounts that save their avatars across devices:

### 1. Get a Free Database

Sign up for a free PostgreSQL database at [Neon.tech](https://neon.tech)

### 2. Set Environment Variable

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host/database
SESSION_SECRET=your-secret-key-here
```

### 3. Push Database Schema

```powershell
npm run db:push
```

### 4. Restart the Server

```powershell
npm run dev
```

## Features

### Without Database
- ✅ Custom avatar creation with color pickers
- ✅ Avatar saved in browser (localStorage)
- ✅ All game modes available
- ✅ Multiplayer gameplay

### With Database (Accounts)
- ✅ Everything above, plus:
- ✅ User accounts with username/password
- ✅ Avatar saved to account (accessible from any device)
- ✅ Sign in/Sign up UI
- ✅ Persistent user data

## Authentication Endpoints

When database is configured:

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in to account
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/me` - Get current user
- `POST /api/auth/update-avatar` - Update user avatar

Without database, these endpoints return a 503 error with a helpful message.
