import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import usageRoutes from './routes/usage';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err: Error) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/usage', usageRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, (): void => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
