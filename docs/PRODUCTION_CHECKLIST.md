# Production Checklist

Use this list before running the app as an always-on Instagram publishing system.

## Environment

- Set `DATABASE_URL` to the Supabase transaction pooler URL with `pgbouncer=true`.
- Set `DIRECT_URL` to the direct Supabase Postgres connection.
- Set `APP_ENCRYPTION_KEY` to a long random secret and keep it stable.
- Set `APP_BASE_URL` to the public HTTPS origin used by Meta and cron jobs.
- Set `CRON_SECRET` to a long random secret.
- Set Instagram OAuth variables to the same app and exact redirect URI registered in Meta.
- Set Ollama/OpenAI provider variables and realistic timeout values.

## Database

- Apply committed Prisma migrations before deploying application code.
- Run `npm run db:generate` after dependency or schema changes.
- Confirm indexes match scheduled publishing and user-scoped lookup paths.
- Keep local SQLite files out of source control.

## Storage

- Create a public Supabase Storage bucket for generated and uploaded media.
- Confirm the service role key is only available server-side.
- Verify generated media returns stable public HTTPS URLs.
- Test thumbnail previews on `/scheduled-posts`.

## Security

- Keep auth/session cookies `httpOnly`, `secure` in production, and `sameSite=lax`.
- Do not log OAuth codes, access tokens, reset tokens, or full request URLs.
- Use durable rate limiting for auth, publishing, and AI generation routes.
- Protect cron routes with `Authorization: Bearer <CRON_SECRET>`.
- Remove or lock diagnostic routes before external exposure.

## Operations

- Run `npm run typecheck`, `npm run lint`, `npm run lint:max-lines`, and `npm run test:unit`.
- Verify Vercel cron schedules match the intended timezone and business cadence.
- Run one publish-now test and one scheduled publish test with a real public URL.
- Confirm token refresh succeeds before the first token expiration window.
- Review application logs for sanitized, actionable messages only.
