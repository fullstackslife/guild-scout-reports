# Warbot.app

A private guild dashboard for sharing and analyzing scouting screenshots with automatic text extraction capabilities.

## Overview

Warbot.app is a Next.js-based application that allows guild members to upload, organize, and share game scouting screenshots. The platform features:

- **User Authentication**: Secure login and signup with Supabase Auth
- **Screenshot Management**: Upload, view, and delete screenshots with descriptions
- **Gallery View**: Browse all guild screenshots organized by member
- **Automatic Text Extraction**: OCR processing to extract text from screenshots using Claude's Vision API
- **Role-based Access**: Support for members and admins with different permissions
- **Secure Storage**: Screenshots stored in Supabase Storage with RLS policies

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js Server Components & Actions, Supabase
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage (screenshots)
- **OCR/Vision**: Anthropic Claude API
- **Authentication**: Supabase Auth

## Project Structure

```
warbot-app/
├── app/
│   ├── (public)/
│   │   ├── login/
│   │   └── signup/
│   ├── (protected)/
│   │   ├── dashboard/        # User's personal uploads
│   │   ├── gallery/          # Guild-wide screenshot gallery
│   │   └── admin/
│   │       └── users/        # User management
│   ├── api/
│   │   └── screenshots/      # API routes for processing
│   ├── auth/
│   │   └── callback/         # OAuth callback
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Public home page
│   └── globals.css           # Global styles
├── components/
│   ├── app-shell.tsx         # Main app layout wrapper
│   ├── forms/                # Reusable form components
│   └── providers/            # Context providers
├── lib/
│   ├── constants.ts          # App constants
│   ├── validators.ts         # Validation utilities
│   └── supabase/
│       ├── client.ts         # Client-side Supabase
│       ├── server.ts         # Server-side Supabase
│       ├── admin.ts          # Admin Supabase client
│       └── database.types.ts # Generated types
├── supabase/
│   └── migrations/
│       └── 0001_init.sql     # Database schema
├── middleware.ts             # Auth middleware
├── next.config.js            # Next.js config
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase project (free tier available at supabase.com)
- Anthropic API key for Claude Vision (for OCR features)
- Git

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/fullstackslife/warbot-app.git
cd warbot-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DATABASE_URL=your_database_url_here

# Anthropic API (for OCR)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Auth
NEXTAUTH_SECRET=generate_with_openssl_rand_hex_32
```

**Getting your Supabase credentials:**
1. Create a project at [supabase.com](https://supabase.com)
2. Navigate to Project Settings → API Keys
3. Copy `Project URL`, `Anon Key`, and `Service Role Key`
4. Get the connection string from Settings → Database

**Getting your Anthropic API key:**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up and create an API key
3. Ensure you have the Claude 3.5 Sonnet or later model available

4. **Set up the database**

```bash
# The migrations will be applied automatically when you run the app
# Or manually via Supabase dashboard → SQL Editor
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

#### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel settings
4. Deploy

```bash
vercel
```

#### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

## Features

### Screenshot Upload

Users can upload screenshots from their dashboard:
- Supported formats: JPEG, PNG, WebP, GIF
- Maximum file size: 10MB
- Optional description/label
- Automatic text extraction (optional, background processing)

### Gallery View

The guild gallery displays:
- All screenshots organized by uploader
- Thumbnails with metadata
- Extracted text preview
- Upload timestamp
- Admin moderation tools (delete, flag inappropriate)

### OCR Text Extraction

Automatic text extraction from screenshots using Claude Vision API:
- Extracts readable text from images
- Stores extracted text in database for search
- Background processing to avoid blocking uploads
- Handles multiple languages
- Can be toggled on/off per upload

### User Management

Admin panel features:
- View all guild members
- Manage user roles
- View user activity
- Delete user accounts and content

## Database Schema

### profiles

```sql
id (uuid, PK) - user ID from auth
email (text) - user email
display_name (text) - user's display name
username (text, unique) - optional unique username
phone (text, unique) - optional phone
role (text) - 'member' or 'admin'
active (boolean) - account status
created_at (timestamptz) - creation date
updated_at (timestamptz) - last update
```

### screenshots

```sql
id (uuid, PK) - unique screenshot ID
user_id (uuid, FK) - uploader's user ID
file_path (text) - storage path
label (text) - optional description
extracted_text (text) - OCR extracted text
processing_status (text) - 'pending', 'completed', 'failed'
created_at (timestamptz) - upload date
```

## API Routes

### Upload Screenshot

**POST** `/api/screenshots`

```json
{
  "file": "File object",
  "label": "string (optional)",
  "extract_text": "boolean (default: true)"
}
```

Response:
```json
{
  "success": true,
  "screenshot": {
    "id": "uuid",
    "file_path": "string",
    "label": "string",
    "created_at": "ISO 8601"
  }
}
```

### Extract Text from Screenshot

**POST** `/api/screenshots/[id]/extract`

```json
{
  "force": "boolean (default: false)"
}
```

Response:
```json
{
  "success": true,
  "extracted_text": "string",
  "processing_status": "completed"
}
```

## Authentication Flow

1. User signs up or logs in via `/public/signup` or `/public/login`
2. Supabase Auth creates a session
3. Middleware checks for valid session on protected routes
4. User is redirected to login if session expires
5. Admin features require `role = 'admin'` in profile

## Security

### Row Level Security (RLS)

- **Profiles**: Users can view/update their own profile
- **Screenshots**: All authenticated users can view, users can upload/delete their own
- **Storage**: Same RLS policies apply to screenshot files

### Authentication

- All protected routes require valid Supabase session
- Service role key only used server-side for admin operations
- Anon key limited to user's own data and public screenshots

### Data Protection

- Screenshots encrypted at rest in Supabase Storage
- Passwords hashed by Supabase Auth (bcrypt)
- Sensitive API keys stored in environment variables only

## Development Guidelines

### Adding a New Page

1. Create folder in `app/(protected)/[feature-name]/`
2. Add `page.tsx` for the route
3. Add `layout.tsx` if needed for nested routes
4. Use server components by default
5. Use "use client" only when needed for interactivity

### Creating API Routes

1. Create `app/api/[resource]/route.ts`
2. Handle specific HTTP methods (GET, POST, PUT, DELETE)
3. Always check authentication with server-side Supabase
4. Return JSON with `success` status and appropriate status codes

### Database Migrations

1. Create SQL file in `supabase/migrations/`
2. Name: `NNNN_description.sql`
3. Make migrations idempotent with `IF NOT EXISTS`
4. Test locally before deploying
5. Run migration and verify in Supabase dashboard

### Styling

- Inline CSS with CSS-in-JS objects (no external CSS framework yet)
- Color scheme: Dark theme (slate/blue palette)
- Responsive design with media queries
- Consistent spacing using 0.25rem increments

## Common Tasks

### Enable OCR for a Screenshot

Add to `.env.local`:
```env
ANTHROPIC_API_KEY=your_key
```

The extraction happens automatically on upload if `ANTHROPIC_API_KEY` is set.

### Add a New User Role

1. Update database migration to include new role in enum/check constraint
2. Update profile creation logic in signup action
3. Add role-checking function in lib/auth.ts
4. Update RLS policies for role-specific access

### Bulk Upload Screenshots

Currently supports individual uploads. For bulk operations:
1. Create `/api/screenshots/bulk` endpoint
2. Accept multipart/form-data with multiple files
3. Process sequentially or with concurrency limit
4. Return batch results with success/error per file

### View Extraction Logs

Check Supabase logs:
1. Navigate to Supabase dashboard
2. Go to Logs section
3. Filter by API calls to see extraction requests
4. Check PostgreSQL logs for database operations

## Troubleshooting

### "Invalid login credentials"

- Ensure email and password match a registered account
- Check that the account hasn't been deleted
- Verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY are correct

### "Storage error: permission denied"

- Check RLS policies in Supabase Storage
- Verify user is authenticated (session valid)
- Ensure file path format matches policy expectations

### "Failed to extract text from screenshot"

- Verify ANTHROPIC_API_KEY is set and valid
- Check Claude API quotas/credits
- Review API response in server logs
- Ensure image format is supported (JPEG, PNG, WebP, GIF)

### Screenshots not appearing in gallery

- Check that RLS policy allows viewing all screenshots
- Verify file paths are correctly stored
- Confirm signed URLs are being generated properly
- Check browser console for fetch errors

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -m 'Add feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a Pull Request with description of changes

## License

Private repository for guild use only.

## Support

For issues or questions:
1. Check existing issues on GitHub
2. Review troubleshooting section above
3. Contact project maintainer: [contact info]

## Roadmap

- [ ] Screenshot tagging/categories
- [ ] Advanced search and filtering
- [ ] Screenshot comparison tools
- [ ] Member activity feed
- [ ] Automated screenshot analysis (game state detection)
- [ ] Mobile app
- [ ] Real-time notifications
- [ ] Screenshot sharing outside guild
- [ ] AI-powered scouting recommendations
- [ ] Batch processing improvements
