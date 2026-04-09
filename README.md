# Instagram AI Publisher Demo

Complete demo app built with Next.js App Router, React, TypeScript, Tailwind CSS, Prisma ORM, Supabase Postgres, Ollama Cloud, Puppeteer, and the Instagram Graph API.

It demonstrates:

- connecting an Instagram Professional account
- retrieving profile data with `instagram_business_basic`
- generating captions, hashtags, and HTML/CSS layouts with Ollama Cloud
- rendering a 1080x1080 post image with Puppeteer
- previewing content before approval
- publishing immediately or scheduling for later

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Next.js Route Handlers, Node.js
- Database: Supabase Postgres with Prisma ORM
- AI: Ollama Cloud API
- Rendering: Puppeteer

## Required Environment Variables

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace-with-your-service-role-key
SUPABASE_STORAGE_BUCKET=instagram-post-media
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:3020/api/auth/instagram/callback
OLLAMA_API_KEY=your-ollama-api-key
OLLAMA_MODEL=kimi-k2.5:cloud
OLLAMA_TIMEOUT_MS=480000
NEXT_PUBLIC_OLLAMA_TIMEOUT_MS=480000
APP_BASE_URL=http://localhost:3020
CRON_SECRET=replace-with-a-long-random-secret
```

`APP_BASE_URL` is strongly recommended for publishing because Instagram must be able to fetch the generated image from a public URL. For real publishing, use a public URL or tunnel.
`OLLAMA_TIMEOUT_MS` is optional and controls how long the server waits for Ollama Cloud before aborting the request.
`CRON_SECRET` is strongly recommended and required in production for the cron routes unless you only invoke them from an authenticated in-app session.

## How To Run

1. Use Node 22 LTS.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project and open `Project Settings > Database`.
5. Copy the Transaction Pooler connection string into `DATABASE_URL` and append `?pgbouncer=true`.
6. Copy the Direct Connection string into `DIRECT_URL`.
7. Run `npm run db:push`.
8. Start the app with `npm run dev`.
9. Open `http://localhost:3020`.

## Supabase + Prisma

- Prisma schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- `DATABASE_URL` is used by Prisma Client at runtime and should point to the Supabase pooler
- `DIRECT_URL` is used by Prisma CLI commands such as `prisma db push`
- `APP_ENCRYPTION_KEY` should be set to a long random secret to encrypt sensitive values stored in the database
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used server-side for durable media uploads to Supabase Storage
- `SUPABASE_STORAGE_BUCKET` defaults to `instagram-post-media` when omitted
- Run `npm run db:generate` after dependency changes
- Run `npm run db:push` whenever the schema changes

## Vercel Deploy

Configure these environment variables in Vercel before the first deploy:

- `DATABASE_URL`
- `DIRECT_URL`
- `APP_ENCRYPTION_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- `OLLAMA_API_KEY`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_MS`
- `NEXT_PUBLIC_OLLAMA_TIMEOUT_MS`
- `APP_BASE_URL`
- `CRON_SECRET`

Production values should usually be:

- `APP_BASE_URL=https://your-project.vercel.app` or your custom domain
- `INSTAGRAM_REDIRECT_URI=https://your-project.vercel.app/api/auth/instagram/callback`
- `CRON_SECRET=` a long random secret used by cron jobs and external automation calls

After the variables are set, run `npm run db:push` once against the Supabase database to create the tables used by the app.

## Cron And Automation Security

The automation routes are now protected in two ways:

- authenticated in-app users can trigger them from `/automation-diagnostics`
- external cron callers must send `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`

Protected routes:

- `GET /api/cron/generate-weekly-content`
- `GET /api/cron/clear-topics-history`
- `POST /api/cron/publish-scheduled`
- `POST /api/cron/refresh-instagram-tokens`

If `CRON_SECRET` is missing in production, these routes will fail loudly so the misconfiguration is visible early.

## Instagram Setup

Create a Meta Developer App and configure Instagram API with Instagram Login.

For this demo, configure:

- Redirect URI: `http://localhost:3020/api/auth/instagram/callback`
- Permissions:
  - `instagram_business_basic`
  - `instagram_business_content_publish`

The Instagram account used in testing must be a Professional account, meaning Business or Creator.

## Ollama Cloud Usage

The app calls Ollama Cloud to generate:

- caption text
- hashtags
- HTML
- CSS

The generated HTML/CSS is rendered locally with Puppeteer to produce a PNG image.

## Puppeteer Notes

- The renderer creates a 1080x1080 JPEG
- If Supabase Storage is configured, generated and uploaded images are stored in a public bucket and served from stable HTTPS URLs
- Without Supabase Storage configured, the app falls back to local files in `public/generated-posts` and `public/uploads`
- If Puppeteer fails locally on your machine, install the browser dependencies required by the platform and rerun `npm install`

## Durable Media Storage

For reliable publishing and scheduled posts in production, configure Supabase Storage:

1. Create a public bucket, usually `instagram-post-media`
2. Set `SUPABASE_URL`
3. Set `SUPABASE_SERVICE_ROLE_KEY`
4. Set `SUPABASE_STORAGE_BUCKET` if you use a different bucket name

The app will then store:

- generated AI images in `generated-posts/...`
- manual uploads in `uploads/...`

This avoids depending on local filesystem persistence between deploys and restarts.
The database stores only media metadata and references such as the public `imageUrl` plus the storage locator, not the image binary itself.

For the `/scheduled-posts` screen, the preview is loaded directly from the Supabase public URL. This keeps database growth predictable while letting the UI render remote thumbnails in production.
When the asset is served from Supabase Storage, the UI now requests transformed thumbnail URLs for small previews so list pages do not download the original full-size image unnecessarily.
The app also persists a `previewUrl` alongside each media item in the stored JSON payload, so screens can prefer a lightweight preview reference and still fall back safely to the original URL.

## Publishing Notes

Instagram publishing requires a publicly reachable `image_url`. If you run locally on `localhost`, Meta cannot fetch your generated image. For an end-to-end live publish test:

1. run the app behind a public HTTPS tunnel
2. set `APP_BASE_URL` to that public URL
3. update `INSTAGRAM_REDIRECT_URI` to the same public host
4. register the same redirect URI in the Meta app dashboard

## Production Checklist

The operational checklist for taking this project from local testing to a reliable always-on setup lives in [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md).

## Technical Documentation

The main technical references for architecture, API contracts, and database design live in:

- [docs/ARCHITECTURE_AND_BUSINESS_RULES.md](docs/ARCHITECTURE_AND_BUSINESS_RULES.md)
- [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md)
- [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

## Review Flow

1. Open `/login`
2. Sign in with any email and password
3. Connect an Instagram Professional account
4. Open `/create-post`
5. Generate the caption, hashtags, and visual layout
6. Preview the image
7. Publish now or schedule the post
8. Review `/scheduled-posts`

## Meta App Review Guidance

When recording the review flow, show:

- local login
- Instagram account connection
- dashboard with connected profile
- create post form
- AI-generated preview
- publish or schedule flow

## Important API Notes

- This app uses the Instagram Login path and the `graph.instagram.com` host for profile and publishing calls.
- Publishing is done via `POST /{ig-user-id}/media` followed by `POST /{ig-user-id}/media_publish`.
- Because Meta periodically updates dashboard labels and app review flows, double-check your app configuration against the current Meta documentation before submitting review.
