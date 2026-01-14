# Database Migration

Update the database schema for the subscriber application.

## Workflow

### 1. Edit Schema
Modify `/prisma/schema.prisma`:
```prisma
model NewModel {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

### 2. Push Changes
```bash
pnpm prisma db push
```

### 3. Regenerate Client
```bash
pnpm prisma generate
```

### 4. Update Shared Types
If needed, add types to `/packages/shared/src/types.ts`:
```typescript
export interface NewModel {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### 5. Add Validation
If needed, add Zod schema to `/packages/shared/src/validation.ts`:
```typescript
export const newModelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
```

### 6. Rebuild Shared Package
```bash
pnpm --filter shared build
```

## Verify Changes
```bash
pnpm prisma studio
```

## Reset Database (Destructive!)
Only in development:
```bash
pnpm prisma db push --force-reset
```

## Common Field Types
```prisma
String          # Text
Int             # Integer
Float           # Decimal
Boolean         # True/False
DateTime        # Timestamp
Json            # JSON data
Decimal         @db.Decimal(10, 2)  # Money
String[]        # Array of strings
```

## Request: $ARGUMENTS
