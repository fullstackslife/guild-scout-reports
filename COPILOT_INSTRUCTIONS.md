# Copilot Instructions for Warbot.app

This document provides guidance for GitHub Copilot and AI assistants working on the Warbot.app project.

## Project Context

**Warbot.app** is a Next.js 14 application for managing guild scouting screenshots with:
- Supabase for authentication and database
- Supabase Storage for file uploads
- Anthropic Claude API for OCR text extraction
- Server components and actions for data handling
- TypeScript throughout the codebase

## Code Style Guidelines

### File Organization

```
/app          - Next.js pages and layouts
/components   - Reusable React components
/lib          - Utility functions and configuration
/supabase     - Database migrations and types
```

### TypeScript Requirements

- Always use strict TypeScript
- Define interfaces for API responses
- Use generated Supabase types from `lib/supabase/database.types.ts`
- No `any` types - use proper typing
- Export types explicitly in files that define them

Example:
```typescript
import type { Database } from '@/lib/supabase/database.types';

type Screenshot = Database['public']['Tables']['screenshots']['Row'];
```

### Naming Conventions

- **Folders**: kebab-case (e.g., `user-management`, `upload-screenshot-form`)
- **Files**: kebab-case for components (e.g., `screenshot-gallery.tsx`)
- **Functions**: camelCase (e.g., `uploadScreenshot`, `extractTextFromImage`)
- **Components**: PascalCase (e.g., `UploadScreenshotForm`, `ScreenshotGallery`)
- **Types/Interfaces**: PascalCase (e.g., `Screenshot`, `UploadState`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `SCREENSHOTS_BUCKET`, `MAX_FILE_SIZE`)

### Styling

- Use inline CSS objects for styling (no Tailwind or external CSS frameworks yet)
- Follow the existing dark theme color palette:
  - Background: `#111827`, `#0f172a`
  - Text: `#e2e8f0`, `#cbd5f5`
  - Accent: `#38bdf8` (cyan), `#34d399` (green)
  - Error: `#f87171` (red)
  - Muted: `#94a3b8`

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

### Component Structure

**Server Components (preferred)**:
```typescript
// app/protected/gallery/page.tsx
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const supabase = createSupabaseServerComponentClient();
  const { data } = await supabase.from('screenshots').select('*');
  
  return <div>{/* render data */}</div>;
}
```

**Client Components** (use only when needed):
```typescript
// components/interactive-component.tsx
"use client";

import { useState } from 'react';

export function InteractiveComponent() {
  const [state, setState] = useState(false);
  return <div>{/* interactive JSX */}</div>;
}
```

### Server Actions

```typescript
// app/protected/dashboard/actions.ts
"use server";

import { revalidatePath } from 'next/cache';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

interface UploadState {
  success?: string;
  error?: string;
}

export async function uploadScreenshot(
  prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { error: 'Not authenticated' };
    }

    // Perform action
    
    revalidatePath('/dashboard');
    return { success: 'Screenshot uploaded successfully' };
  } catch (error) {
    console.error('Upload error:', error);
    return { error: 'Failed to upload screenshot' };
  }
}
```

## Database Guidelines

### Adding New Tables

1. Create migration file: `supabase/migrations/NNNN_description.sql`
2. Use `IF NOT EXISTS` for idempotency
3. Add RLS policies immediately
4. Update `lib/supabase/database.types.ts` after running migration

Example migration:
```sql
create table if not exists public.guild_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.guild_announcements enable row level security;

create policy "Anyone can read announcements"
on public.guild_announcements
for select
using (true);

create policy "Only admins can insert announcements"
on public.guild_announcements
for insert
to authenticated
with check (
  exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);
```

### Querying Best Practices

```typescript
// Always select specific columns when possible
const { data } = await supabase
  .from('screenshots')
  .select('id, file_path, label, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Use filters and limits to reduce data transfer
const { data } = await supabase
  .from('screenshots')
  .select('*')
  .eq('user_id', userId)
  .limit(10);

// Always handle errors
const { data, error } = await supabase.from('screenshots').select('*');
if (error) {
  console.error('Database error:', error);
  return { error: 'Failed to fetch screenshots' };
}
```

## API Routes

### Structure

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

## OCR/Vision API Integration

### Using Anthropic Claude for Text Extraction

```typescript
// Example: Extract text from screenshot
import Anthropic from '@anthropic-ai/sdk';

async function extractTextFromImage(imageUrl: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl
            }
          },
          {
            type: 'text',
            text: 'Extract all readable text from this screenshot. Format it clearly, preserving layout when possible.'
          }
        ]
      }
    ]
  });

  const textContent = message.content[0];
  if (textContent.type === 'text') {
    return textContent.text;
  }
  
  throw new Error('No text response from Claude');
}
```

### Best Practices for Vision API Calls

- Check if image is too large (max 5MB typically)
- Use signed URLs from Supabase Storage
- Implement retry logic with exponential backoff
- Cache extraction results in database
- Show loading states to users during processing
- Handle API quota/rate limit errors gracefully

## Authentication & Authorization

### Checking User Session

```typescript
const supabase = createSupabaseServerComponentClient();
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  redirect('/login');
}

const userId = session.user.id;
```

### Checking User Role

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

## Common Patterns

### Error Handling

```typescript
try {
  // operation
} catch (error) {
  console.error('Operation failed:', error);
  
  if (error instanceof Error) {
    return { error: error.message };
  }
  
  return { error: 'An unexpected error occurred' };
}
```

### Form State Management

Use React's `useFormState` hook for server action forms:

```typescript
const [state, formAction] = useFormState(serverAction, initialState);

return (
  <form action={formAction}>
    {state?.error && <div>{state.error}</div>}
    {state?.success && <div>{state.success}</div>}
    {/* form fields */}
  </form>
);
```

### Loading States with useFormStatus

```typescript
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

### Required for Development

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_DATABASE_URL=postgresql://[connection-string]

# Anthropic API
ANTHROPIC_API_KEY=[api-key]

# Auth
NEXTAUTH_SECRET=[random-secret]
```

### Optional

```env
# Feature flags
NEXT_PUBLIC_ENABLE_OCR=true
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

## Testing Guidelines

### Testing Server Actions

```typescript
// __tests__/actions.test.ts
import { uploadScreenshot } from '@/app/protected/dashboard/actions';

describe('uploadScreenshot', () => {
  it('should upload a screenshot with valid data', async () => {
    const formData = new FormData();
    formData.append('file', new File(['test'], 'test.png', { type: 'image/png' }));
    
    const result = await uploadScreenshot({}, formData);
    expect(result.success).toBeDefined();
  });
});
```

### Testing Components

```typescript
// __tests__/gallery.test.tsx
import { render, screen } from '@testing-library/react';
import { ScreenshotGallery } from '@/components/screenshot-gallery';

describe('ScreenshotGallery', () => {
  it('should display screenshots', () => {
    render(<ScreenshotGallery screenshots={mockData} />);
    expect(screen.getByText('Screenshot Title')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={signedUrl}
  alt="description"
  width={1200}
  height={720}
  sizes="(max-width: 768px) 100vw, 900px"
  priority={false}
/>
```

### Query Optimization

- Use `.select()` to fetch only needed columns
- Use `.limit()` to reduce data transfer
- Implement pagination for large datasets
- Cache frequently accessed data with Supabase Edge Functions or Redis

### Build Optimization

```bash
# Analyze bundle
npm run build -- --analyze

# Check performance
npm run lint
npm run build
```

## Deployment Checklist

- [ ] All environment variables set in production
- [ ] Database migrations applied to production
- [ ] RLS policies verified
- [ ] Storage bucket policies correct
- [ ] API keys rotated in production
- [ ] Error logging configured
- [ ] Rate limiting implemented for public APIs
- [ ] Secrets not committed to git
- [ ] CORS configured properly
- [ ] Backups enabled in database

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## When to Ask for Help

- Unclear project requirements
- Complex database schema changes
- Security-related decisions
- Performance bottlenecks
- Integration with new external services
- Architectural changes

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/description

# Make changes and commit
git add .
git commit -m "feat: add screenshot gallery"

# Push and create PR
git push origin feature/description

# After review and approval
git checkout main
git pull origin main
git merge feature/description
git push origin main
```

## Commit Message Convention

```
feat: add screenshot gallery view
fix: correct OCR text extraction for non-English text
docs: update README with deployment instructions
refactor: improve screenshot upload validation
chore: update dependencies
perf: optimize gallery image loading
```

---

**Last Updated**: November 2025
**Created By**: Warbot.app Team
