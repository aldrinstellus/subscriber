import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { prisma } from '../services/prisma';
import { verifySupabaseToken } from '../services/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  supabaseUserId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized - No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const supabaseUser = await verifySupabaseToken(token);
    
    if (!supabaseUser) {
      throw new AppError(401, 'Unauthorized - Invalid token');
    }

    req.supabaseUserId = supabaseUser.id;

    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!user) {
      const email = supabaseUser.email;
      
      if (!email) {
        throw new AppError(400, 'No email associated with account');
      }

      // Check if user exists by email (migration from old auth)
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link existing user to Supabase
        user = await prisma.user.update({
          where: { id: user.id },
          data: { supabaseId: supabaseUser.id },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            supabaseId: supabaseUser.id,
            email,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
            avatar: supabaseUser.user_metadata?.avatar_url || null,
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
