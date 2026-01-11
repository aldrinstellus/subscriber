import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { subscriptionRouter } from './routes/subscriptions';
import { categoryRouter } from './routes/categories';
import { analyticsRouter } from './routes/analytics';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/analytics', analyticsRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Subscriber API running on http://localhost:${PORT}`);
});

export default app;
