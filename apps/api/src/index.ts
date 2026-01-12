import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';

import { errorHandler } from './middleware/errorHandler';
import { subscriptionRouter } from './routes/subscriptions';
import { categoryRouter } from './routes/categories';
import { analyticsRouter } from './routes/analytics';
import { exportRouter } from './routes/export';
import { userRouter } from './routes/user';
import { authRouter } from './routes/auth';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(express.json());

// Clerk middleware - must be before routes
app.use(clerkMiddleware());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/user', userRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/export', exportRouter);
app.use('/api/auth', authRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Subscriber API running on http://localhost:${PORT}`);
});

export default app;
