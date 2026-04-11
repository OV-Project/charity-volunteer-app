// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import database from './config/database.js'; // Import correct
import MissionRoutes from './routes/MissionRoute.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));// === MIDDLEWARES ===
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuration CORS plus spécifique
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' })); // Limiter taille payload
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined')); // 'combined' donne plus d'infos
app.use("/api/missions",MissionRoutes);

// === ROUTES ===
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    database: database.isConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Benevolat API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// === DÉMARRAGE ===
const PORT = process.env.PORT || 5000;

// Connecter DB puis démarrer serveur
const startServer = async () => {
  try {
    await database.connect();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Gestion des signaux pour fermeture propre
process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

// SIMPLE API TO TEST//
//app.get("/api/missions",(req,res) => {
  //res.status(200).json({id:1 , mission : "done"})
//})

startServer();