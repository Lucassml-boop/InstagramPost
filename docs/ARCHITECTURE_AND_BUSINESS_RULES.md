# Architecture And Business Rules

## Overview

This document describes the technical architecture, business rules, security model, and engineering guidelines for the project.

## Current Implementation Note

The requested reference architecture mentions:

- Frontend: React with Vite and TypeScript
- Backend: Next.js API Routes
- Database: Supabase PostgreSQL

The current repository is implemented as a unified Next.js application using:

- Frontend: React rendered through Next.js App Router
- Backend: Next.js Route Handlers in `app/api`
- Database: Supabase PostgreSQL accessed through Prisma ORM
- Storage: Supabase Storage for generated and uploaded images

This document therefore does two things:

1. documents the system as it exists today
2. records the recommended architectural direction for long-term modularization

## 1. Business Rules

### 1.1 System Objective

The system is an Instagram publishing workspace focused on:

- authenticating users locally
- connecting one Instagram Professional account per user
- generating captions, hashtags, and layouts with AI
- rendering post images
- publishing immediately or scheduling publication
- reviewing local publishing history and the live Instagram feed

### 1.2 Main Functionalities

- local login and session management
- Instagram OAuth connection
- AI post generation for feed, story, and carousel
- image rendering and storage
- manual media upload
- post scheduling
- immediate publishing
- automated scheduled publishing through cron routes
- automation diagnostics
- local queue/history cleanup from the scheduled posts screen

### 1.3 Main User Flow

1. User logs in through `/login`.
2. User connects an Instagram Professional account.
3. User creates a post in `/create-post`.
4. AI generates caption, hashtags, and visual layout.
5. The system renders the final media and stores it in Supabase Storage or local fallback storage.
6. User either publishes immediately or schedules the post.
7. Scheduled items are processed by cron or manual diagnostics actions.
8. User reviews local post history in `/scheduled-posts`.
9. User can remove local records from the scheduled posts screen to reduce visual clutter.

### 1.4 Business Restrictions

- A user can have only one connected Instagram account at a time.
- Publishing requires a connected Instagram Professional account.
- Publishing requires a public, reachable image URL.
- Carousel posts require between 2 and 10 images for Instagram publication.
- Story posts may be created with image-only flow.
- Scheduled publication only processes posts in `SCHEDULED` status with `scheduledTime <= now`.
- Deleting posts from `/scheduled-posts` removes the local record only.
- Deleting a locally published record does not delete the already published post from Instagram.

### 1.5 Important System States

The `Post` entity uses the following business states:

- `DRAFT`: generated or created, but not scheduled or published
- `SCHEDULED`: waiting for future publication
- `PUBLISHING`: in-flight publication process
- `PUBLISHED`: published successfully
- `FAILED`: publication failed and may be retried or removed

### 1.6 Business Error Handling

Common business errors include:

- unauthorized user
- missing Instagram connection
- invalid schedule date
- media not publicly reachable
- invalid carousel media count
- expired or invalid Instagram token
- missing required environment variables in production

Error responses currently use a lightweight pattern:

```json
{
  "error": "Human-readable message"
}
```

Recommended future standard:

```json
{
  "success": false,
  "data": null,
  "error": "Human-readable message"
}
```

## 2. Security

### 2.1 Authentication

Current implementation:

- custom session-based authentication
- session token stored in an `httpOnly` cookie
- session records stored in the `Session` table
- 7-day session TTL

Current cookie protections:

- `httpOnly`
- `sameSite=lax`
- `secure=true` in production

Recommended long-term options:

- keep secure server-side sessions, or
- migrate to Supabase Auth, or
- migrate to JWT only if revocation and refresh-token strategy are defined

### 2.2 Authorization

Authorization is user-scoped:

- queries are filtered by `userId`
- protected pages check `getCurrentUser()`
- cron routes accept either authenticated session or `CRON_SECRET`

Future role model recommendation:

- `user`
- `admin`
- `automation`

### 2.3 Route Protection

Current protection layers:

- frontend protected layout redirects unauthenticated users to `/login`
- backend handlers validate current user before mutating data
- cron endpoints validate `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`

### 2.4 Data Validation

Current implementation:

- request payload validation is performed with Zod in `lib/validators.ts`
- backend validation is mandatory before business logic

Recommended rule:

- frontend may validate for UX
- backend must always validate as source of truth

### 2.5 Input Sanitization

Current protections:

- Prisma prevents raw SQL string concatenation in normal usage
- React escapes rendered strings by default
- route handlers validate structure before processing

Recommended additions:

- sanitize or constrain any future rich HTML user input
- validate external URLs more strictly if arbitrary URLs are accepted
- keep using parameterized ORM access only

### 2.6 Environment Variables

Rules:

- secrets must remain server-side only
- never expose service role keys in frontend bundles
- all production secrets must be set through deployment environment configuration
- `.env.local` must never be committed with real secrets

Critical variables include:

- `DATABASE_URL`
- `DIRECT_URL`
- `APP_ENCRYPTION_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- `APP_BASE_URL`
- `CRON_SECRET`

### 2.7 CORS

Current application runs as same-origin Next.js frontend and backend, so explicit CORS handling is minimal.

If external consumers are introduced:

- use an allowlist
- restrict methods and headers
- never allow wildcard origins with credentials

### 2.8 Rate Limiting

Current implementation:

- in-memory application rate limiting for login, registration, password reset, AI generation, scheduling, and publishing
- cron endpoints remain protected by authenticated session or `CRON_SECRET`

Recommended future implementation:

- move rate limit counters to durable storage such as Postgres or Redis if multiple server instances need shared counters
- add per-plan quotas if the product introduces paid limits

## 3. Modularization

### 3.1 Frontend

Requested reference structure:

```txt
components/
pages/
hooks/
services/
contexts/
utils/
styles/
```

Current implementation is Next.js App Router with the following practical structure:

```txt
app/
components/
lib/
types/
public/
```

Recommended frontend rules:

- keep components small and reusable
- keep UI rendering separate from orchestration logic
- move repeated async client logic into reusable hooks when it appears more than once
- centralize API calls in `services/` or `lib/client/` as the frontend grows
- keep every source file at 200 lines or fewer; split files into hooks, helpers, and section components before crossing this limit
- maintain strong TypeScript typing for props and API contracts

### 3.2 Backend

Requested reference structure:

```txt
app/api/
services/
repositories/
controllers/
middlewares/
utils/
```

Current implementation:

- route handlers in `app/api`
- domain logic mostly concentrated in `lib/`
- Prisma access done directly in `lib/posts.ts`, `lib/auth.ts`, `lib/instagram.ts`, and related modules

Recommended target structure:

```txt
app/api/.../route.ts        -> controller layer
lib/services/               -> business rules
lib/repositories/           -> database access only
lib/middlewares/            -> auth, validation, cron access
lib/utils/                  -> stateless helpers
```

Architectural rules:

- controllers should parse request and return response only
- services must own business rules
- repositories should isolate persistence details
- validation should happen before service execution
- auth middleware/helpers should be reused instead of duplicated

### 3.3 Current Practical Mapping

- `app/api/*`: route handlers
- `lib/auth.ts`: authentication and sessions
- `lib/posts.ts`: post business logic
- `lib/instagram.ts`: Instagram API integration
- `lib/storage.ts`: media storage
- `lib/api-handlers/*`: reusable API orchestration helpers
- `lib/validators.ts`: request validation schemas

## 4. Database (Supabase)

### 4.1 Core Tables

Current core tables from Prisma schema:

- `User`
- `Session`
- `InstagramAccount`
- `Post`
- `PostMedia`
- `PublicationAttempt`
- `ContentBrandProfile`
- `ContentWeeklyAgenda`
- `ContentTopicsHistory`
- `ContentHistory`
- `AutomationRun`

### 4.2 Relationships

- `User 1:N Session`
- `User 1:N Post`
- `User 1:1 InstagramAccount`

### 4.3 Foreign Keys

Current foreign keys:

- `Session.userId -> User.id`
- `InstagramAccount.userId -> User.id`
- `Post.userId -> User.id`

All are configured with `onDelete: Cascade`.

### 4.4 Indexes

Current indexes:

- `Session.userId`
- `InstagramAccount.connected, tokenExpiresAt`
- `Post.userId, status, scheduledTime`
- `Post.userId, publishedAt`
- `Post.publishedMediaId`
- `PostMedia.postId`
- `PublicationAttempt.userId, startedAt`
- `PublicationAttempt.postId, startedAt`
- `AutomationRun.job, startedAt`
- `AutomationRun.userId, startedAt`

Recommended future indexes:

- `Post.userId, createdAt desc` for timeline/history views
- `Post.publishedMediaId` if reverse lookup is needed
- `User.emailHash` is already unique and supports secure identity lookup

### 4.5 Normalization

The project is mostly aligned with 3NF:

- users, sessions, Instagram accounts, and posts are separated
- session data is isolated from user identity
- Instagram connection state is isolated from post content

Important compatibility note:

- `Post.mediaItems` is still stored as JSON for backward compatibility with existing UI flows
- new and rescheduled posts also mirror media into `PostMedia` for queryability, constraints, analytics, and future media lifecycle management

## 5. Frontend to Backend Integration

### 5.1 Communication Pattern

Current pattern:

- same-origin REST-style requests using `fetch`
- JSON request/response payloads

Examples:

- `POST /api/auth/login`
- `POST /api/posts/generate`
- `POST /api/posts/publish`
- `POST /api/posts/schedule`
- `POST /api/posts/delete`

### 5.2 Response Standard

Current implementation is mixed:

- success often returns `{ ok: true }` or domain-specific payload
- errors usually return `{ error: string }`

Recommended standard for future convergence:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

and

```json
{
  "success": false,
  "data": null,
  "error": "Message"
}
```

### 5.3 Frontend Loading and Error Handling

Current practices:

- UI uses local loading states
- feedback banners show success and error messages
- request errors are converted to user-readable messages

Recommended rules:

- every async user action must show loading state
- every mutation should return actionable error text
- long-running AI operations should display progress or timeout feedback

## 6. Tests

### 6.1 Current Test Strategy

Current automated coverage includes:

- unit tests for validators
- handler-level tests for post generation and publishing flows
- tests for automation and supporting utilities

Current runner:

- Node.js built-in test runner

### 6.2 Recommended Test Pyramid

- unit tests for pure functions, validators, crypto helpers, and service logic
- integration tests for API routes and persistence flows
- optional end-to-end tests for authentication, generation, scheduling, and deletion

Recommended future tools if needed:

- Testing Library for client components
- Playwright for browser flows
- test database or Supabase preview environment for integration suites

## 7. Logging and Monitoring

### 7.1 Current Logging

Current backend logging uses `console.info`, `console.warn`, and `console.error` in critical flows such as:

- AI generation
- Instagram token refresh
- Instagram publishing
- storage metadata application

### 7.2 Logging Guidelines

Log categories should be standardized as:

- auth
- posts
- instagram
- cron
- storage
- ai

Recommended log format:

- operation name
- user or entity identifier when safe
- status
- duration
- error summary

Never log:

- raw access tokens
- service role keys
- full secrets
- unredacted personal data unless strictly required

### 7.3 Monitoring Roadmap

Recommended future additions:

- structured logging
- centralized log aggregation
- alerting for cron failures
- error monitoring for route handlers
- performance monitoring for generation and publish latency

## 8. Code Standards

### 8.1 Linting and Formatting

Current project uses:

- ESLint
- TypeScript

Recommended addition:

- Prettier or equivalent formatting standard if the team wants explicit formatting enforcement

### 8.2 Naming Conventions

- `camelCase` for variables and functions
- `PascalCase` for React components and types representing entities/components
- `UPPER_SNAKE_CASE` for constants that represent immutable global values

### 8.3 Imports

Rules:

- prefer absolute imports through the configured alias when available
- group external imports before internal imports
- avoid unused imports

### 8.4 Commits

Recommended commit convention:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `test:`
- `chore:`

## 9. Scalability and Maintenance

Guidelines:

- keep business logic isolated from transport layer
- prefer low coupling and high cohesion
- centralize repeated constants and config
- avoid duplicated validation and duplicated fetch logic
- use reusable helpers for auth, errors, and storage

Practical scalability concerns in this project:

- AI generation latency
- image rendering cost
- Instagram API rate and token lifecycle
- long-term media storage growth
- cron reliability
- publication retry/audit growth

Recommended future improvements:

- queue system for heavy jobs
- repository layer for persistence
- background workers for rendering and publish retries
- durable distributed rate limiting

## 10. Versioning and Organization

### 10.1 Git

Use Git as the source of truth for:

- code history
- review process
- release management

### 10.2 Repository Strategy

Current repository is effectively a monorepo-like single application repository.

Two valid long-term strategies:

- keep unified repository while the product remains tightly coupled
- split frontend and backend only if deployment cadence, team ownership, or scale requires it

### 10.3 Branch Strategy

Recommended strategy:

- `main`: production-ready code
- `develop`: integration branch
- `feature/*`: new features
- `fix/*`: bug fixes

## 11. Documentation

### 11.1 Local Setup

1. Use Node.js 22.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure Supabase database and storage.
5. Run `npm run db:push`.
6. Start the app with `npm run dev`.
7. Open `http://localhost:3020`.

### 11.2 Required Environment Variables

Minimum required variables:

```env
DATABASE_URL=
DIRECT_URL=
APP_ENCRYPTION_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=
OLLAMA_API_KEY=
OLLAMA_MODEL=
APP_BASE_URL=
CRON_SECRET=
```

### 11.3 API Examples

Login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "reviewer@example.com",
  "password": "123456"
}
```

Schedule post:

```http
POST /api/posts/schedule
Content-Type: application/json

{
  "postId": "post_123",
  "caption": "Updated caption",
  "scheduledTime": "2026-04-10T14:30:00.000Z"
}
```

Delete local post records:

```http
POST /api/posts/delete
Content-Type: application/json

{
  "postIds": ["post_1", "post_2"]
}
```

### 11.4 Architecture Documentation Rule

This file must be updated whenever there is a meaningful change in:

- authentication model
- entity model
- API contracts
- background processing strategy
- storage architecture
- deployment topology

## Summary

The project now has a stronger operational foundation for Instagram-oriented AI publishing: scheduled publishing is processed by due time instead of once per day, cron routes support Vercel-compatible GET execution, content automation is scoped by user when database tables are available, media has a normalized mirror table, publication attempts are audited, and basic rate limits protect high-cost or sensitive routes. The next architectural improvement should be clearer separation between route handlers, services, and repositories, plus standardized API responses and a durable job queue for heavy AI/rendering work.
