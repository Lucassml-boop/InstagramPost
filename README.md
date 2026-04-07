# Instagram AI Publisher Demo

Complete demo app built with Next.js App Router, React, TypeScript, Tailwind CSS, Prisma ORM, Supabase Postgres, OpenAI, Puppeteer, and the Instagram Graph API.

It demonstrates:

- connecting an Instagram Professional account
- retrieving profile data with `instagram_business_basic`
- generating captions, hashtags, and HTML/CSS layouts with OpenAI
- rendering a 1080x1080 post image with Puppeteer
- previewing content before approval
- publishing immediately or scheduling for later

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Next.js Route Handlers, Node.js
- Database: Supabase Postgres with Prisma ORM
- AI: OpenAI API
- Rendering: Puppeteer

## Required Environment Variables

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback
OPENAI_API_KEY=your-openai-api-key
APP_BASE_URL=http://localhost:3000
```

`APP_BASE_URL` is strongly recommended for publishing because Instagram must be able to fetch the generated image from a public URL. For real publishing, use a public URL or tunnel.

## How To Run

1. Use Node 22 LTS.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project and open `Project Settings > Database`.
5. Copy the Transaction Pooler connection string into `DATABASE_URL` and append `?pgbouncer=true`.
6. Copy the Direct Connection string into `DIRECT_URL`.
7. Run `npm run db:push`.
8. Start the app with `npm run dev`.
9. Open `http://localhost:3000`.

## Supabase + Prisma

- Prisma schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- `DATABASE_URL` is used by Prisma Client at runtime and should point to the Supabase pooler
- `DIRECT_URL` is used by Prisma CLI commands such as `prisma db push`
- `APP_ENCRYPTION_KEY` should be set to a long random secret to encrypt sensitive values stored in the database
- Run `npm run db:generate` after dependency changes
- Run `npm run db:push` whenever the schema changes

## Vercel Deploy

Configure these environment variables in Vercel before the first deploy:

- `DATABASE_URL`
- `DIRECT_URL`
- `APP_ENCRYPTION_KEY`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- `OPENAI_API_KEY`
- `APP_BASE_URL`

Production values should usually be:

- `APP_BASE_URL=https://your-project.vercel.app` or your custom domain
- `INSTAGRAM_REDIRECT_URI=https://your-project.vercel.app/api/auth/instagram/callback`

After the variables are set, run `npm run db:push` once against the Supabase database to create the tables used by the app.

## Instagram Setup

Create a Meta Developer App and configure Instagram API with Instagram Login.

For this demo, configure:

- Redirect URI: `http://localhost:3000/api/auth/instagram/callback`
- Permissions:
  - `instagram_business_basic`
  - `instagram_business_content_publish`

The Instagram account used in testing must be a Professional account, meaning Business or Creator.

## OpenAI Usage

The app calls OpenAI to generate:

- caption text
- hashtags
- HTML
- CSS

The generated HTML/CSS is rendered locally with Puppeteer to produce a PNG image.

## Puppeteer Notes

- The renderer creates a 1080x1080 PNG inside `public/generated-posts`
- Uploaded custom images are stored in `public/uploads`
- If Puppeteer fails locally on your machine, install the browser dependencies required by the platform and rerun `npm install`

## Publishing Notes

Instagram publishing requires a publicly reachable `image_url`. If you run locally on `localhost`, Meta cannot fetch your generated image. For an end-to-end live publish test:

1. run the app behind a public HTTPS tunnel
2. set `APP_BASE_URL` to that public URL
3. update `INSTAGRAM_REDIRECT_URI` to the same public host
4. register the same redirect URI in the Meta app dashboard

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
