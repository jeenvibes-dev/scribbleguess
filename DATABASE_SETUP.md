# Setting Up User Accounts for DoodlRush

## Quick Setup (Free Database)

### Option 1: Neon (Recommended - Free)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy your connection string (looks like: `postgresql://user:password@host/database`)
5. Create a `.env` file in the project root:

```env
DATABASE_URL=your_connection_string_here
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=development
PORT=5000
```

6. Run database migrations:
```bash
npm run db:push
```

7. Restart the server:
```bash
npm run dev
```

### Option 2: Use Without Database

The app works perfectly without a database! User avatars are saved in browser localStorage and persist across sessions. The only limitation is avatars won't sync across different devices.

## What You Get With Database

✅ User accounts with username/password
✅ Avatars saved to your account
✅ Access your avatar from any device
✅ Persistent user profiles

## What You Get Without Database

✅ Full game functionality
✅ Custom avatars
✅ Avatar saved in browser
✅ No setup required
