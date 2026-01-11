import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { registerUserSchema, loginUserSchema } from 'shared';

export const authRouter = Router();

// Register new user
authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(409, 'User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        timezone: true,
        createdAt: true,
      },
    });

    // Create default categories
    const defaultCategories = [
      { name: 'Streaming', icon: 'tv', color: '#ef4444' },
      { name: 'Music', icon: 'music', color: '#22c55e' },
      { name: 'Software', icon: 'code', color: '#3b82f6' },
      { name: 'Gaming', icon: 'gamepad-2', color: '#8b5cf6' },
      { name: 'Other', icon: 'box', color: '#6b7280' },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId: user.id,
      })),
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const data = loginUserSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          currency: user.currency,
          timezone: user.timezone,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
authRouter.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        currency: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});
