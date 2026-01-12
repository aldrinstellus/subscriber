import { Request, Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { AppError } from './errorHandler';
import { prisma } from '../services/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  clerkUserId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new AppError(401, 'Unauthorized');
    }

    req.clerkUserId = auth.userId;

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!user) {
      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (!email) {
        throw new AppError(400, 'No email associated with account');
      }

      // Check if user exists by email (migration from old auth)
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link existing user to Clerk
        user = await prisma.user.update({
          where: { id: user.id },
          data: { clerkId: auth.userId },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            clerkId: auth.userId,
            email,
            name: clerkUser.fullName || clerkUser.firstName || null,
            avatar: clerkUser.imageUrl,
          },
        });

        // Create default categories for new user
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
            userId: user!.id,
          })),
        });
      }
    }

    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
};
