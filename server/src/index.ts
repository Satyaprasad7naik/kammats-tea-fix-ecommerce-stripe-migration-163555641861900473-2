import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import adminRouter from './routes/admin';
import cookieParser from 'cookie-parser';
import os from 'os';
import { requestLogger } from './middleware/logger';
import { startBackupCron } from './utils/backup';
import { startCommunicationRetryJob } from './services/communication';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Security Middlewares
app.use(helmet());

// Logging Middleware
app.use(requestLogger);

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', async (req, res) => {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

  let dbStatus = 'disconnected';
  try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
  } catch (err) {
      console.error('Database connectivity check failed', err);
  }

  res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      server: {
          uptime: process.uptime(),
          memoryUsage: `${memoryUsagePercent}%`,
          freeMemoryMB: (freeMem / 1024 / 1024).toFixed(2),
          totalMemoryMB: (totalMem / 1024 / 1024).toFixed(2)
      }
  });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Exception:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startBackupCron();
  startCommunicationRetryJob();
});
