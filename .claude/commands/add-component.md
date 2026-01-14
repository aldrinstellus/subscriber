# Add React Component

Create a new React component following project patterns.

## Location
- Reusable components: `/apps/web/src/components/`
- Page components: `/apps/web/src/pages/`

## Template
```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconName } from 'lucide-react';
import { subscriptionsApi } from '../services/api';

interface ComponentNameProps {
  prop1: string;
  prop2?: number;
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  const [state, setState] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['key', prop1],
    queryFn: () => subscriptionsApi.list()
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Component content */}
    </div>
  );
}
```

## Patterns
- Use TypeScript with explicit prop types
- Use Lucide icons: `import { Plus, Edit, Trash } from 'lucide-react'`
- Use TailwindCSS for all styling
- Use React Query for data fetching
- Use Zustand for auth: `import { useAuthStore } from '../stores/authStore'`
- Use `date-fns` for date formatting

## Common Imports
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { subscriptionsApi, categoriesApi } from '../services/api';
```

## Request: $ARGUMENTS
