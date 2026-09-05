import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorMiddleware';

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import worksRoutes from './routes/worksRoutes';
import riskRoutes from './routes/riskRoutes';
import mapRoutes from './routes/mapRoutes';
import alertRoutes from './routes/alertRoutes';
import inspectionRoutes from './routes/inspectionRoutes';
import dataQualityRoutes from './routes/dataQualityRoutes';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all for hackathon demonstration
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MPLADS AI Risk Intelligence Platform',
    version: '1.0.0-hackathon-release',
    mode: 'PROTOTYPE_DEMO_SEEDED_DATA',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/data-quality', dataQualityRoutes);

import { initializeAndSeedDatabase } from './services/seedService';

// Global Error Handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Checking database and seed state...');
    await initializeAndSeedDatabase();
  } catch (err: any) {
    console.error('⚠️ Seed note:', err.message);
  }

  app.listen(config.port, () => {
    console.log(`=================================================`);
    console.log(`🚀 MPLADS AI Backend Service Active on Port ${config.port}`);
    console.log(`📡 Base API URL: http://localhost:${config.port}/api`);
    console.log(`🛡️  Auth: Enabled | Mode: Prototype Demo`);
    console.log(`=================================================`);
  });
};

startServer();

export default app;

