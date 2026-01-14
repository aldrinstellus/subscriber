# Add API Endpoint

Add a new API endpoint to the subscriber application.

## Location
All API routes are in `/api/index.ts` (Vercel serverless entry point).

## Pattern
```typescript
app.get('/api/your-endpoint', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const result = await prisma.model.findMany({
      where: { userId: req.userId }
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
```

## Checklist
1. Add route in `/api/index.ts`
2. Use `authenticate` middleware for protected routes
3. Access user ID via `req.userId`
4. Add Zod validation schema in `/packages/shared/src/validation.ts`
5. Add TypeScript types in `/packages/shared/src/types.ts`
6. Add frontend API method in `/apps/web/src/services/api.ts`
7. Test with `curl` or browser

## Response Format
```typescript
// Success
res.json({ success: true, data: result });

// Error
res.status(400).json({ success: false, error: 'Message' });

// Validation error
res.status(400).json({
  success: false,
  error: 'Validation failed',
  details: zodError.errors
});
```

## Request: $ARGUMENTS
