# Quick Start Guide

Get Guild Scout Reports running in 5 minutes.

## Prerequisites

- Node.js 18+
- A Supabase account (free at [supabase.com](https://supabase.com))

## Setup (5 minutes)

### 1. Clone & Install (1 minute)

```bash
git clone https://github.com/fullstackslife/guild-scout-reports.git
cd guild-scout-reports
npm install
```

### 2. Configure Supabase (2 minutes)

Create a Supabase project at [app.supabase.com](https://app.supabase.com)

In Supabase dashboard → SQL Editor, run both migration files:
- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_add_ocr_fields.sql`

### 3. Create .env.local (1 minute)

```bash
# Create file in root directory
echo 'NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
SUPABASE_DATABASE_URL=your_connection_string
NEXTAUTH_SECRET=any-random-string-here' > .env.local
```

Replace with your Supabase credentials from Settings → API

### 4. Run (1 minute)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

## Next Steps

1. **Sign up** at `/signup`
2. **Upload a screenshot** at `/dashboard`
3. **View gallery** at `/gallery`

## Optional: Enable OCR

Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com)

Add to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-your-key
```

Restart dev server. Uploaded images will now have text extracted automatically!

## Troubleshooting

### "Cannot find module '@anthropic-ai/sdk'"
```bash
npm install
```

### "NEXT_PUBLIC_SUPABASE_URL is missing"
- Check `.env.local` exists in root
- Verify all environment variables are set
- Restart dev server

### "Invalid login credentials"
- Check Supabase URL and keys are correct
- Ensure user exists in Supabase Auth (signup first)

### Screenshots not showing
- Check you're logged in
- Verify RLS policies in Supabase Storage
- Check browser console for errors (F12)

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run start            # Start production server

# Lint & quality
npm run lint             # Check code style
```

## Project Structure

```
app/                     # Pages and routes
├── (public)/            # Public pages (login, signup)
├── (protected)/         # Protected pages (dashboard, gallery)
└── api/                 # API routes

components/             # Reusable components
lib/                    # Utilities (Supabase, OCR, validators)
supabase/              # Database migrations
```

## Key Files to Know

- `.env.local` - Environment variables (never commit!)
- `app/(protected)/gallery/page.tsx` - Gallery view
- `app/(protected)/dashboard/actions.ts` - Upload logic
- `lib/ocr.ts` - OCR text extraction
- `lib/supabase/database.types.ts` - Database types

## Documentation

- **README.md** - Feature overview
- **SETUP.md** - Detailed setup guide
- **COPILOT_INSTRUCTIONS.md** - Development standards
- **PROJECT_OVERVIEW.md** - Architecture explanation

## Deploy to Production

### Vercel (Recommended)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables
5. Deploy 🚀

### Docker

```bash
docker build -t guild-scout-reports .
docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=... guild-scout-reports
```

## Getting Help

1. Check browser console (F12)
2. Check server logs (terminal)
3. Review Supabase dashboard → Logs
4. Search GitHub issues
5. Read detailed docs in SETUP.md and PROJECT_OVERVIEW.md

---

**Happy coding!** 🎮
