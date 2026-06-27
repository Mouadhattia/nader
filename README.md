# Audio Guest Book

A full-stack audio guest book for events. Guests select an active event, hear the event's recorded welcome audio, then leave an audio message. Admins can create events, record or upload welcome audio, and review recordings per event.

## Features

- Guest kiosk page at `/guest`
- Admin dashboard at `/admin`
- Event management with name, start date, end date, active/inactive status, and welcome note
- Admin-recorded or uploaded welcome audio per event
- Guest recording flow tied to the selected event
- Event-specific recordings list in the admin dashboard
- Download and delete recordings
- MongoDB storage for event/recording metadata
- Local file storage for uploaded audio

## Project Structure

```text
audio-guest-book-application/
├── backend/                 # Express, MongoDB, upload handling
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   │   ├── audio/           # Runtime guest recordings, gitignored
│   │   └── welcome/         # Runtime welcome audio, gitignored
│   ├── .env.example
│   └── server.js
├── public/
├── src/                     # React + Vite frontend
├── .env.example
├── package.json             # Root frontend and deployment scripts
└── vite.config.ts
```

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB local or MongoDB Atlas

## Local Development

Install dependencies:

```bash
npm run install:all
```

Create backend env:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/audio-guest-book
FRONTEND_URL=http://localhost:3000
```

Start backend:

```bash
cd backend
npm run dev
```

Start frontend in a second terminal:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/admin
http://localhost:3000/guest
```

## Production Build

The recommended VPS setup runs the frontend and backend as two processes:

- Frontend: `3331`
- Backend API: `6321`

```bash
npm run deploy:build
```

Start frontend:

```bash
npm run start:frontend
```

Start backend:

```bash
npm run start:backend
```

Production URLs:

```text
http://localhost:3331/admin
http://localhost:3331/guest
http://localhost:6321/health
```

## Deployment

Use a VPS or another Node host.

Recommended settings:

```text
Build command: npm run deploy:build
Frontend start command: npm run start:frontend
Backend start command: npm run start:backend
```

Environment variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/audio-guest-book
PORT=6321
FRONTEND_URL=https://mouadhattia.xyz
```

If the frontend and backend are deployed on separate domains, set the frontend production API URL:

```env
VITE_API_URL=https://api.mouadhattia.xyz
```

For PM2:

```bash
pm2 start npm --name audio-guest-book-frontend -- run start:frontend
pm2 start npm --name audio-guest-book-backend -- run start:backend
pm2 save
```

Nginx should proxy:

```text
mouadhattia.xyz -> http://127.0.0.1:3331
api.mouadhattia.xyz -> http://127.0.0.1:6321
```

Production env templates are included:

```text
.env.production.example
backend/.env.production.example
```

For phone microphone access, deploy over HTTPS. Mobile browsers often block microphone access on LAN HTTP.

## Runtime Audio Storage

Audio files are stored locally under:

```text
backend/uploads/audio
backend/uploads/welcome
```

Those files are intentionally ignored by Git. If you deploy to a platform with an ephemeral filesystem, uploaded audio can disappear after restart/redeploy. Use a VPS, persistent disk, or cloud object storage for real events.

## Git Setup

Secrets, dependencies, build output, and runtime uploads are ignored by `.gitignore`.

After creating a GitHub repository:

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git add .
git commit -m "Initial audio guest book app"
git push -u origin main
```

Never commit `.env` files or real MongoDB credentials.

## Scripts

```bash
npm run dev          # Frontend dev server on port 3000
npm run build        # Build frontend
npm run start        # Start backend and serve built frontend from one process
npm run start:frontend # Serve built frontend on port 3331
npm run start:backend  # Start production backend on port from backend/.env.production
npm run install:all  # Install root and backend dependencies
npm run deploy:build # Install all dependencies and build frontend
```

Backend-only scripts:

```bash
cd backend
npm run dev
npm start
```
