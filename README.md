# Live Polling System

A real-time polling application that enables teachers to create interactive polls and students to participate in them instantly. Teachers can ask questions with multiple choice options, set timers, and view live results as students vote. The system includes chat functionality and teacher controls for managing the classroom experience.

**Live Demo**: [https://live-polling-system-kohl.vercel.app](https://live-polling-system-kohl.vercel.app)

## What it does

- **Teachers** can create polls with multiple choice questions and timers
- **Students** can join and vote on polls in real-time
- **Real-time results** are displayed to both teachers and students
- **Chat functionality** for communication during polls
- **Teacher controls** to kick out students if needed
- **Poll history** to view past polls and results

## Tech Stack

- **Frontend**: React, Vite, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB
- **Deployment**: Vercel (frontend), Render (backend)

## Quick Start

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Environment Variables

**Backend** (`.env`):
```
MONGODB_URL=your_mongodb_connection_string
PORT=3000
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:3000
```

## Deployment

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- Set environment variables in respective platforms

## Usage

1. Teacher logs in and creates a poll
2. Students join using the poll link
3. Students vote on the poll
4. Results are displayed in real-time
5. Teacher can view poll history