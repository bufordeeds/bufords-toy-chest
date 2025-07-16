import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupWebSocket } from './websocket/socketHandler.js';
import { setupRoutes } from './routes/index.js';
import { initDatabase } from './services/database.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',') 
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    // Setup routes
    setupRoutes(app);
    
    // Setup WebSocket
    setupWebSocket(io);
    
    server.listen(PORT, () => {
      console.log(`🎮 Buford's Toy Chest Backend running on port ${PORT}`);
      console.log(`🌐 WebSocket server ready for multiplayer games`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();