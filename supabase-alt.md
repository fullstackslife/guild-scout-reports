Good question. If we throw Supabase out, we’re basically choosing:

1. How to do auth
2. Where to put data
3. Where to put images

All without adding new paid stuff.

Let me walk the realistic options, then I’ll give you a Copilot issue you can paste in that uses no Supabase.

---

## Option A: Roll-your-own auth with NextAuth + Postgres + S3-style storage

This is the cleanest “I own everything” setup.

**Pieces**

* Auth: NextAuth (now Auth.js)

  * Google login
  * Credentials provider for `identifier + password`

    * `identifier` can be email, username, or phone, we just look it up in the DB.
* Database: free Postgres

  * Neon / Railway / Render all have free Postgres tiers.
  * You only need a few tables: `users`, `sessions`, `accounts`, `screenshots`.
* Storage: S3-compatible object storage with a free tier

  * Cloudflare R2, Backblaze B2, or even plain S3 if you’re careful.
  * From the app’s point of view it is just “S3 with env vars”.

**Pros**

* No Supabase lock-in, just standard Postgres and S3.
* NextAuth is very well documented for Google + credentials.
* Easy to move later if you decide to self-host Postgres or MinIO.

**Cons**

* You are responsible for migrations (Prisma or raw SQL).
* A bit more plumbing than Supabase’s click-click console.

For your guild size (60 folks), this is totally fine.

---

## Option B: Firebase Auth + Firebase Storage (no DB at first)

If you want to avoid running a DB at all, you could:

* Use Firebase Auth for:

  * Google sign-in
  * Email/password
  * Phone login (if you really care about actual SMS flows)
* Use Firebase Storage for screenshot files.
* Store metadata in Firestore or just in the client for v1.

**Pros**

* Zero servers to manage.
* Free tier is usually plenty for 60 people.

**Cons**

* Vendor lock-in and very Google-flavored.
* Access control gets messy if you’re not used to Firebase security rules.
* Wiring it into Next.js is a bit more bespoke versus NextAuth + DB.

This is “fast and dirty but works”.

---

## Option C: GitHub-as-backend for screenshots (weird but cheap)

If you really want **no extra infra**:

* Use NextAuth with a single provider (Google).
* Store all user info in a lightweight Postgres / SQLite solution.
* For screenshots:

  * API route uploads the image,
  * Commits it straight to the GitHub repo in a `/screenshots/` folder via the GitHub API.
  * Metadata (who uploaded, when, caption) lives in a DB table or even a JSON file in the repo.

**Pros**

* No S3, no object storage bills.
* Every screenshot is automatically versioned and backed up in Git.

**Cons**

* Git repo gets heavy over time.
* Slower for lots of screenshots.
* This is clever, but also janky if people start spamming uploads.

For a small, low-frequency guild, it is actually viable.

---

## What I’d pick for you

Given everything you’ve told me about keeping costs at zero and not wanting to over-engineer:

**I’d go with Option A, but keep it generic.**

* Next.js on Vercel (you already have Pro).
* NextAuth + Prisma + Postgres (Neon free tier is perfectly fine).
* S3-compatible storage with env-based config (so you can start with Cloudflare R2 or S3 and change later).

You get a “real” stack, no Supabase, and everything is swappable.

---

## Copilot issue: same spec as before, but no Supabase

Here’s a version you can paste directly into GitHub for Copilot, rewritten to avoid Supabase and keep things generic.

---

**Title:** Implement guild auth and screenshot upload MVP without Supabase

**Context**

We need a small “guild” site (about 60 users max) running on Vercel Pro. Users should be able to log in, see a private dashboard, and upload/view screenshots.

No Supabase. No new paid services beyond what we already have. Free tiers are fine (Postgres, S3-compatible storage etc).

Public sign-up should NOT be available. We (admins) will create and manage accounts manually.

**Tech constraints**

* Frontend: existing Next.js app in this repo (TypeScript if present).
* Hosting: Vercel Pro.
* Auth: NextAuth (Auth.js) or similar library, no external auth SaaS like Auth0/Clerk.
* Database: Postgres via a free provider (for example Neon / Railway / Render). The code should only rely on `DATABASE_URL` so we can choose the provider.
* Storage: S3-compatible object storage (Cloudflare R2, S3, MinIO etc) accessed by env vars. Do not hardcode any provider.

If the repo already has a preferred ORM or DB client, use that. Otherwise use Prisma.

**Auth requirements**

* Login options:

  * Google OAuth.
  * Email + password (via credentials provider).
  * Username or phone number should be usable as the login “identifier”, but still backed by email/password in the DB.
* No public self-registration:

  * Only existing users in the DB can log in.
  * Add an admin-only UI for user management so we can:

    * Create / edit users.
    * Fields: display name, email, optional username, optional phone number, role (admin or member), active flag.
* After login, users land on a private dashboard route.
* All private routes must be protected:

  * Unauthenticated users get redirected to login.
  * Use a shared auth layout / middleware pattern, not copy-pasted guard logic.

**Database and models**

Use Postgres and Prisma (or the project’s existing ORM) with at least:

* `User`

  * `id`
  * `email` (unique)
  * `username` (optional, unique)
  * `phone` (optional, unique)
  * `displayName`
  * `role` (`'admin' | 'member'`)
  * `active` boolean
  * `createdAt`, `updatedAt`
* Any standard NextAuth tables (`Account`, `Session`, `VerificationToken`) if using NextAuth.
* `Screenshot`

  * `id`
  * `userId` (FK to `User`)
  * `fileKey` or `filePath` (path in the bucket)
  * `publicUrl` (optional precomputed URL)
  * `description`
  * `createdAt`

Add migrations or Prisma schema updates as needed.

**Screenshot upload requirements**

* Authenticated users can upload image files from the dashboard.

* Files should be uploaded to an S3-compatible bucket, not to the Vercel filesystem.

* Use env-based config for storage, for example:

  * `STORAGE_ENDPOINT`
  * `STORAGE_REGION`
  * `STORAGE_BUCKET`
  * `STORAGE_ACCESS_KEY_ID`
  * `STORAGE_SECRET_ACCESS_KEY`

* For each uploaded screenshot, create a `Screenshot` record with the fields above.

* UI:

  * Simple upload form on the dashboard (drag and drop is nice but optional).
  * List of the user’s own screenshots with thumbnail, description, and created date.
  * Optional “guild gallery” page that shows all members’ screenshots.

**Security and permissions**

* Only authenticated users can upload or view screenshots.
* Members:

  * Can see their own uploads.
  * If a guild gallery exists, they can view all screenshots but only delete their own.
* Admins:

  * Can view and delete any screenshot.
  * Can create, activate, deactivate users.

**Route protection**

* Implement a shared auth wrapper (middleware or server components with session check) so:

  * `/dashboard` and any nested routes are protected.
  * `/admin` requires an admin user.
* Keep this DRY and centralized.

**Environment and configuration**

Use env vars only:

* `DATABASE_URL`
* `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
* `GOOGLE_CLIENT_ID`
* `GOOGLE_CLIENT_SECRET`
* Storage env vars listed above.

Add a README section that documents:

* Which env vars are required.
* How to run the app locally.
* How to run through:

  * Admin login.
  * Creating a test user.
  * Uploading a screenshot.

**Tasks for Copilot**

1. Set up DB access (Prisma + Postgres) with migrations for `User`, `Screenshot` and NextAuth tables.
2. Configure NextAuth (or equivalent) with:

   * Google provider.
   * Credentials provider using `identifier + password` to look up by email, username or phone.
3. Implement session handling and route protection for dashboard and admin routes.
4. Build admin UI to:

   * List users.
   * Create / edit / deactivate users and roles.
5. Implement S3-compatible file upload:

   * Server route or server action that handles upload securely using env vars.
   * Client upload component on the dashboard.
6. Implement UI for:

   * User’s own screenshot list.
   * Optional guild-wide gallery.
7. Update README with setup instructions.

**Acceptance criteria**

* I can run the app locally with `DATABASE_URL` and storage envs set.
* I can create an admin user (seed script or manual), log in, and create member accounts.
* I can log in as a member via Google or credentials, upload a screenshot, and see it in my list.
* Admin can see all screenshots and delete any of them.
* No Supabase dependency anywhere in the code.

---

If you want to go even more barebones (for example, no S3, just jam everything in GitHub), we can do a stripped-down issue for that too, but the stack above is something you can actually grow into without painting yourself into a corner.
