# GitHub Copilot Instructions

This document provides repository-specific guidance for GitHub Copilot when working on the Guild Scout Reports project.

## Project Overview

Guild Scout Reports is a Next.js 14 application for managing guild scouting screenshots with:
- Supabase for authentication, database, and storage
- Anthropic Claude API for OCR text extraction
- Server components and actions for data handling
- TypeScript throughout the codebase

## Architecture

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage for screenshots
- **Authentication**: Supabase Auth
- **OCR/Vision**: Anthropic Claude API

## Code Style & Conventions

### File Structure
```
/app          - Next.js pages, layouts, and API routes (App Router)
/components   - Reusable React components
/lib          - Utility functions, Supabase clients, types
/supabase     - Database migrations
```

### Naming Conventions
- **Files & Folders**: kebab-case (e.g., `screenshot-gallery.tsx`, `user-management/`)
- **Components**: PascalCase (e.g., `ScreenshotGallery`)
- **Functions**: camelCase (e.g., `uploadScreenshot`)
- **Types/Interfaces**: PascalCase (e.g., `Screenshot`, `UploadState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### TypeScript Requirements
- Always use strict TypeScript with no `any` types
- Use generated Supabase types from `lib/supabase/database.types.ts`
- Define interfaces for all API responses and form states
- Export types explicitly

Example:
```typescript
import type { Database } from '@/lib/supabase/database.types';
type Screenshot = Database['public']['Tables']['screenshots']['Row'];
```

### Component Patterns

**Prefer Server Components** (default):
```typescript
// app/(protected)/gallery/page.tsx
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data } = await supabase.from('screenshots').select('*');
  return <div>{/* render */}</div>;
}
```

**Use Client Components only when needed** (state, events, browser APIs):
```typescript
"use client";
import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState(false);
  return <button onClick={() => setState(!state)}>{/* JSX */}</button>;
}
```

### Server Actions Pattern
```typescript
"use server";
import { revalidatePath } from 'next/cache';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

interface ActionState {
  success?: string;
  error?: string;
}

export async function myAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Not authenticated' };
    }

    // Perform action
    
    revalidatePath('/path');
    return { success: 'Action completed' };
  } catch (error) {
    console.error('Action error:', error);
    return { error: 'Failed to complete action' };
  }
}
```

## Styling

Use inline CSS objects (no Tailwind or external CSS frameworks):
- Dark theme palette:
  - Background: `#111827`, `#0f172a`
  - Text: `#e2e8f0`, `#cbd5f5`
  - Accent: `#38bdf8` (cyan), `#34d399` (green)
  - Error: `#f87171` (red)
  - Muted: `#94a3b8`
- Consistent spacing using 0.25rem increments

Example:
```typescript
style={{
  padding: '1rem',
  borderRadius: '0.75rem',
  background: '#111827',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.2)'
}}
```

## Database Guidelines

### Querying Best Practices
```typescript
// Always select specific columns when possible
const { data, error } = await supabase
  .from('screenshots')
  .select('id, file_path, label, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);

// Always handle errors
if (error) {
  console.error('Database error:', error);
  return { error: 'Failed to fetch data' };
}
```

### Creating Migrations
1. Create file: `supabase/migrations/NNNN_description.sql`
2. Use `IF NOT EXISTS` for idempotency
3. Add RLS policies immediately
4. Update `lib/supabase/database.types.ts` after migration

Example:
```sql
create table if not exists public.new_table (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.new_table enable row level security;

create policy "Users can view their own data"
on public.new_table
for select
to authenticated
using (auth.uid() = user_id);
```

## API Routes Structure

```typescript
// app/api/resource/route.ts
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Perform operation
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Authentication & Authorization

### Check User Session
```typescript
const supabase = createSupabaseServerComponentClient();
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  redirect('/login');
}
```

### Check User Role
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (profile?.role !== 'admin') {
  return Response.json(
    { error: 'Admin access required' },
    { status: 403 }
  );
}
```

## OCR Integration

Use Anthropic Claude for text extraction from screenshots:
```typescript
import Anthropic from '@anthropic-ai/sdk';

async function extractTextFromImage(imageUrl: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: 'Extract all readable text from this screenshot.' }
      ]
    }]
  });

  const textContent = message.content[0];
  return textContent.type === 'text' ? textContent.text : '';
}
```

## Common Patterns

### Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('Operation failed:', error);
  return { error: error instanceof Error ? error.message : 'Unexpected error' };
}
```

### Form State with useFormState
```typescript
"use client";
import { useFormState } from 'react-dom';

const [state, formAction] = useFormState(serverAction, { success: '', error: '' });

return (
  <form action={formAction}>
    {state?.error && <div style={{ color: '#f87171' }}>{state.error}</div>}
    {state?.success && <div style={{ color: '#34d399' }}>{state.success}</div>}
    {/* form fields */}
  </form>
);
```

### Loading States with useFormStatus
```typescript
"use client";
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? 'Loading...' : 'Submit'}
    </button>
  );
}
```

## Environment Variables

### Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Anthropic API (for OCR)
ANTHROPIC_API_KEY=[api-key]

# Auth
NEXTAUTH_SECRET=[random-secret]
```

## Performance Best Practices

- Use Server Components by default for better performance
- Select only needed columns in database queries
- Implement pagination for large datasets
- Use `next/image` for image optimization
- Cache API responses when appropriate
- Use `.limit()` on Supabase queries

## Security Guidelines

- All protected routes require valid Supabase session
- Use Row Level Security (RLS) policies on all tables
- Service role key only used server-side
- Never commit secrets to git
- Validate and sanitize all user inputs
- Use parameterized queries (Supabase handles this)

## Testing

While tests are not currently implemented, when adding tests:
- Use Jest for unit tests
- Use React Testing Library for component tests
- Test server actions with mock Supabase clients
- Test error cases and edge conditions

## Commit Message Convention

Follow conventional commits:
```
feat: add new feature
fix: correct bug
docs: update documentation
refactor: improve code structure
chore: update dependencies
perf: optimize performance
```

## Important Notes

1. **Always prefer Server Components** unless you need client-side interactivity
2. **Check authentication** on all protected routes and API endpoints
3. **Handle errors gracefully** and provide user-friendly messages
4. **Use TypeScript strictly** - no `any` types
5. **Follow existing patterns** in the codebase for consistency
6. **Revalidate paths** after mutations using `revalidatePath()`
7. **Use proper HTTP status codes** in API responses
8. **Keep migrations idempotent** with `IF NOT EXISTS`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- Project README: `/README.md`
- Detailed instructions: `/COPILOT_INSTRUCTIONS.md`
