# Guild Scout Reports - Project Overview

## What Is This Project?

**Guild Scout Reports** is a web application designed for gaming guilds to share, organize, and analyze game screenshots (scout reports). It provides:

- 🔐 Secure user authentication
- 📸 Screenshot upload and storage
- 🖼️ Guild gallery view
- 🤖 Automatic text extraction from images using AI (OCR)
- 👥 User and admin management
- 🔍 Search capabilities for extracted text

Think of it as a "Pinterest for guild scouts" - members upload screenshots of important game moments, and the system automatically reads text from those images for analysis.

## Real-World Use Case

**Scenario**: A guild plays a game where members scout rival guilds' base layouts or attack strategies.

1. **Member uploads** a screenshot of a rival base
2. **System automatically extracts** all visible text (building names, stats, coordinates)
3. **Guild sees extracted data** in the gallery
4. **Guild leaders** can analyze patterns and make strategy decisions

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Client (Browser)                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Next.js (React 18)                              │   │
│  │  - Gallery view                                  │   │
│  │  - Upload form                                   │   │
│  │  - Dashboard                                     │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
┌────────────────────▼────────────────────────────────────┐
│           Next.js Server                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Server Components & Actions                      │   │
│  │  - Upload handling                                │   │
│  │  - OCR processing                                 │   │
│  │  - Auth verification                             │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
        ┌────────────┴────────────┬──────────────────┐
        │                         │                  │
        ▼                         ▼                  ▼
┌──────────────────┐   ┌──────────────────┐  ┌────────────┐
│  Supabase Auth   │   │  Supabase DB     │  │  Claude    │
│  (PostgreSQL)    │   │  (PostgreSQL)    │  │  Vision    │
│                  │   │                  │  │  API       │
│  - Users         │   │  - profiles      │  │            │
│  - Sessions      │   │  - screenshots   │  │  (Anthrop) │
└──────────────────┘   └──────────────────┘  └────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │  Storage Bucket  │
                      │  (Screenshots)   │
                      └──────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 14**: React framework with Server Components
- **React 18**: UI library
- **TypeScript**: Type safety
- **CSS-in-JS**: Inline styling (no external CSS framework)

### Backend
- **Next.js Server Actions**: Server-side form handling
- **API Routes**: Custom endpoints
- **Middleware**: Authentication routing

### Database & Storage
- **Supabase PostgreSQL**: User data, screenshot metadata
- **Supabase Auth**: User authentication (email/password)
- **Supabase Storage**: Screenshot file storage
- **Row Level Security (RLS)**: Data access control

### AI/OCR
- **Anthropic Claude 3.5 Sonnet**: Vision-based text extraction
- **Claude API**: Makes HTTP requests to analyze images

### DevOps
- **Vercel**: Deployment platform (recommended)
- **Docker**: Containerization option
- **GitHub**: Version control and hosting

## Key Features Explained

### 1. Authentication

Users can:
- Sign up with email and password
- Log in to access protected features
- Have sessions managed by Supabase Auth

**Flow**:
```
User enters email/password
         ↓
Supabase Auth validates
         ↓
Session created (stored in cookies)
         ↓
User can access /protected routes
```

### 2. Screenshot Upload

Members upload game screenshots:

**Flow**:
```
User selects image file
         ↓
File uploaded to browser
         ↓
Form submitted to Next.js
         ↓
Image stored in Supabase Storage
         ↓
Metadata stored in PostgreSQL
         ↓
OCR processing triggered (async)
         ↓
Extracted text saved to database
```

### 3. Gallery View

Shows all screenshots shared by guild:

**Features**:
- Grouped by member
- Thumbnail previews
- Extracted text preview (if available)
- Upload timestamp
- Admin delete capability

### 4. OCR Text Extraction

Automatically reads text from images:

**Process**:
```
Screenshot uploaded
         ↓
Create signed URL (secure access)
         ↓
Send image to Claude Vision API
         ↓
Claude analyzes image
         ↓
Extract readable text
         ↓
Save to database
         ↓
Gallery shows extracted text
```

## Database Schema

### profiles table
```
id (UUID) ................... User ID (from Auth)
email (text) ................ User's email
display_name (text) ......... User's display name
username (text, unique) ..... Optional unique username
phone (text, unique) ........ Optional phone number
role (text) ................. 'member' or 'admin'
active (boolean) ............ Account status
created_at (timestamp) ...... Account creation date
updated_at (timestamp) ...... Last update date
```

### screenshots table
```
id (UUID) ................... Screenshot ID
user_id (UUID) .............. Who uploaded it
file_path (text) ............ Path in storage bucket
label (text) ................ User's description
extracted_text (text) ....... AI-extracted text
processing_status (text) .... 'pending', 'completed', 'failed'
processed_at (timestamp) .... When OCR finished
created_at (timestamp) ...... Upload date
```

## API Endpoints

### Authentication
- `POST /auth/callback` - OAuth callback
- Uses Supabase Auth (handled automatically)

### Screenshots
- `POST /api/screenshots/[id]/extract` - Manually trigger OCR
  - Input: `{ force: boolean }`
  - Output: `{ success: boolean, extracted_text?: string }`

### Server Actions (Form Actions)
- `uploadScreenshot` - Upload new screenshot
- `deleteScreenshot` - Delete a screenshot
- `retryOCRForScreenshot` - Retry text extraction

## File Organization

```
app/
├── (public)/              # Public pages (no auth required)
│   ├── login/             # Login page
│   └── signup/            # Sign up page
├── (protected)/           # Protected pages (auth required)
│   ├── dashboard/         # User's uploads
│   ├── gallery/           # Guild gallery (all screenshots)
│   └── admin/             # Admin panel
├── api/                   # API routes
│   └── screenshots/[id]/extract/
├── auth/                  # Auth routes
│   └── callback/          # OAuth callback
├── layout.tsx             # Root layout
├── page.tsx               # Home page
└── globals.css            # Global styles

components/
├── app-shell.tsx          # Main app layout
├── forms/                 # Form components
│   └── upload-screenshot-form.tsx
└── providers/             # Context providers
    └── supabase-provider.tsx

lib/
├── constants.ts           # App constants
├── validators.ts          # Input validation
├── ocr.ts                 # OCR/Vision API
├── ocr-utils.ts           # OCR utilities
└── supabase/
    ├── client.ts          # Client-side Supabase
    ├── server.ts          # Server-side Supabase
    ├── admin.ts           # Admin Supabase client
    └── database.types.ts  # Generated TypeScript types

supabase/
└── migrations/            # Database migrations
    ├── 0001_init.sql      # Initial schema
    └── 0002_add_ocr_fields.sql
```

## Development Workflow

### Making a Change

```bash
# 1. Create feature branch
git checkout -b feature/description

# 2. Make your changes
# 3. Add/commit changes
git add .
git commit -m "feat: description"

# 4. Test locally
npm run dev
# Test in browser

# 5. Push and create PR
git push origin feature/description
# Create PR on GitHub
```

### Testing Locally

```bash
# Start dev server
npm run dev

# In another terminal, check for errors
npm run lint

# Build for production (test build)
npm run build
npm run start
```

## Performance Considerations

### Database
- Indexes on frequently queried columns
- Pagination for large datasets
- Signed URLs for storage access (expires in 1 hour)

### Frontend
- Server components reduce JavaScript sent to browser
- Image optimization with Next.js Image component
- Lazy loading for gallery images

### API
- Rate limiting considerations
- Error handling and retries
- Background processing (OCR doesn't block upload)

## Security Features

### Authentication
- Passwords hashed by Supabase (bcrypt)
- Sessions stored securely in cookies
- CSRF protection built-in

### Database
- Row Level Security (RLS) policies
- Users can only see/modify their own data
- Admins can moderate all content

### Storage
- Signed URLs expire after 1 hour
- Users can only upload their own files
- Admins can delete any files

### API Keys
- `NEXT_PUBLIC_` keys are safe (anon key)
- `SUPABASE_SERVICE_ROLE_KEY` only used server-side
- `ANTHROPIC_API_KEY` only used server-side
- Never exposed to client

## Common Tasks

### Add a new user role
1. Update database schema in migration
2. Update `ProcessingStatus` type in `database.types.ts`
3. Add role-checking logic where needed

### Enable/disable OCR
1. OCR enabled by default if `ANTHROPIC_API_KEY` is set
2. Remove key from `.env.local` to disable
3. Set to empty string: `ANTHROPIC_API_KEY=`

### Add a new screenshot field
1. Create migration file
2. Add column to PostgreSQL
3. Update `database.types.ts`
4. Update insert/update actions
5. Update UI components

### Modify styling
- All styling is inline CSS objects
- Located in each component
- Use existing color palette for consistency

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Storage bucket policies configured
- [ ] API keys rotated (production-specific)
- [ ] Secrets added to deployment platform
- [ ] No secrets in git history
- [ ] Tests pass
- [ ] Build completes successfully
- [ ] Error logging configured
- [ ] Backups enabled

## Monitoring & Maintenance

### Regular checks
- View Supabase logs for errors
- Monitor API usage (Anthropic)
- Check storage usage
- Review user activity

### Common issues
- Screenshots not appearing → Check RLS policies
- OCR failing → Check API key and credits
- Upload errors → Check storage policies
- Auth issues → Check callback URL config

## Future Enhancements

- [ ] Screenshot tagging/categories
- [ ] Full-text search in extracted text
- [ ] Screenshot comparison tools
- [ ] Member activity feed
- [ ] Automated analysis (pattern detection)
- [ ] Mobile app
- [ ] Real-time notifications
- [ ] Advanced image filters
- [ ] Screenshot sharing links
- [ ] AI-powered recommendations

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Questions?

Refer to:
1. **README.md** - Project overview and features
2. **SETUP.md** - Installation and configuration
3. **COPILOT_INSTRUCTIONS.md** - Development guidelines
4. **This file** - Architecture and project structure

---

**Last Updated**: November 2025
