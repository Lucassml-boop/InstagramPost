# Database Schema

## Overview

This document describes the logical database design used by the project.

Current database stack:

- Supabase PostgreSQL
- Prisma ORM

Primary schema source of truth:

- `prisma/schema.prisma`

## Database Goals

The data model is designed to support:

- local user authentication
- session persistence
- one Instagram connection per user
- generated and scheduled posts
- publishing audit trail

## Entity Diagram

```txt
User
 |- Session (1:N)
 |- Post (1:N)
 |- InstagramAccount (1:1)
 |- ContentBrandProfile (1:1)
 |- ContentWeeklyAgenda (1:1)
 |- ContentTopicsHistory (1:1)
 |- ContentHistory (1:1)
 |- AutomationRun (1:N)

Post
 |- PostMedia (1:N)
 |- PublicationAttempt (1:N)
```

## Tables

### 1. User

Purpose:

- stores local application user identity
- stores encrypted email representation
- stores user preferences for generation

Main fields:

- `id`
- `email`
- `emailHash`
- `emailEncrypted`
- `emailIv`
- `emailTag`
- `passwordHash`
- `preferredOutputLanguage`
- `preferredCustomInstructions`
- `createdAt`
- `updatedAt`

Business rules:

- one logical account per email hash
- email is stored with privacy-preserving encryption strategy
- password is stored as bcrypt hash

Indexes and constraints:

- primary key on `id`
- unique on `email`
- unique on `emailHash`

### 2. Session

Purpose:

- stores active authenticated sessions

Main fields:

- `id`
- `userId`
- `sessionHash`
- `expiresAt`
- `createdAt`

Business rules:

- one cookie token maps to one hashed server-side session
- expired sessions should not authenticate requests

Relationships:

- many sessions belong to one user

Indexes and constraints:

- primary key on `id`
- unique on `sessionHash`
- index on `userId`
- foreign key `userId -> User.id`

### 3. InstagramAccount

Purpose:

- stores Instagram Professional account connection metadata
- stores encrypted access token and account identifiers

Main fields:

- `id`
- `userId`
- `instagramUserId`
- `instagramUserIdHash`
- `instagramUserIdEncrypted`
- `instagramUserIdIv`
- `instagramUserIdTag`
- `username`
- `usernameEncrypted`
- `usernameIv`
- `usernameTag`
- `profilePictureUrl`
- `accessToken`
- `accessTokenIv`
- `accessTokenTag`
- `tokenExpiresAt`
- `tokenLastRefreshedAt`
- `connected`
- `createdAt`
- `updatedAt`

Business rules:

- each user may have at most one connected Instagram account
- the same Instagram account should not remain linked to multiple local users
- token refresh timestamps are tracked to prevent unnecessary refreshes

Relationships:

- one Instagram account belongs to one user

Indexes and constraints:

- primary key on `id`
- unique on `userId`
- unique on `instagramUserId`
- unique on `instagramUserIdHash`
- index on `connected, tokenExpiresAt`
- foreign key `userId -> User.id`

### 4. Post

Purpose:

- stores generated, scheduled, failed, and published local post records

Main fields:

- `id`
- `userId`
- `topic`
- `message`
- `tone`
- `postType`
- `brandColors`
- `keywords`
- `caption`
- `hashtags`
- `htmlLayout`
- `mediaItems`
- `imageUrl`
- `imagePath`
- `status`
- `scheduledTime`
- `publishedMediaId`
- `publishedAt`
- `lastPublishError`
- `lastPublishAttemptAt`
- `publishRetryCount`
- `createdAt`
- `updatedAt`

Business rules:

- posts are always scoped to one user
- the system stores the cover image separately from `mediaItems` for practical access
- `mediaItems` can represent feed, story, or carousel assets
- media is also mirrored into `PostMedia` for normalized querying
- scheduled posts are selected by `status = SCHEDULED` and `scheduledTime <= now`
- deleting a post record removes local history only

Relationships:

- many posts belong to one user

Indexes and constraints:

- primary key on `id`
- index on `userId, status, scheduledTime`
- index on `userId, publishedAt`
- index on `publishedMediaId`
- foreign key `userId -> User.id`

### 5. PostMedia

Purpose:

- stores normalized media rows for generated, uploaded, and carousel assets

Main fields:

- `id`
- `postId`
- `position`
- `imageUrl`
- `imagePath`
- `previewUrl`
- `mimeType`
- `sizeBytes`
- `createdAt`

Indexes and constraints:

- primary key on `id`
- unique on `postId, position`
- index on `postId`
- foreign key `postId -> Post.id`

### 6. PublicationAttempt

Purpose:

- stores an audit trail for each Instagram publication attempt

Main fields:

- `id`
- `postId`
- `userId`
- `status`
- `error`
- `startedAt`
- `finishedAt`
- `createdMediaId`

Indexes and constraints:

- primary key on `id`
- index on `userId, startedAt`
- index on `postId, startedAt`
- foreign key `postId -> Post.id`

### 7. Content Automation Tables

Purpose:

- scope editorial automation data by application user instead of using only global JSON files

Tables:

- `ContentBrandProfile`
- `ContentWeeklyAgenda`
- `ContentTopicsHistory`
- `ContentHistory`

Business rules:

- each table has one row per user
- JSON fallback files remain supported for local/test contexts without a user id

### 8. AutomationRun

Purpose:

- records cron/automation executions and their summaries

Main fields:

- `id`
- `userId`
- `job`
- `status`
- `summary`
- `error`
- `startedAt`
- `finishedAt`

## Enums

### PostStatus

```txt
DRAFT
SCHEDULED
PUBLISHING
PUBLISHED
FAILED
```

### PostType

```txt
FEED
STORY
CAROUSEL
```

### PublicationAttemptStatus

```txt
STARTED
SUCCEEDED
FAILED
SKIPPED
```

### AutomationRunStatus

```txt
STARTED
SUCCEEDED
FAILED
```

## Relationships

### User -> Session

- cardinality: `1:N`
- delete behavior: cascade

### User -> InstagramAccount

- cardinality: `1:1`
- delete behavior: cascade

### User -> Post

- cardinality: `1:N`
- delete behavior: cascade

## Normalization Analysis

### Current Compliance

The current schema is broadly aligned with third normal form:

- authentication data is separated from content data
- Instagram account data is separated from local user data
- session lifecycle is separated from user identity
- posts are separated from account connection details

### Controlled Compatibility Exception

`Post.mediaItems` is stored as JSON rather than a normalized child table.

Reasonable benefits for compatibility:

- flexible structure for feed, story, and carousel media
- existing UI flows can continue reading the JSON payload

Tradeoffs:

- writes must keep `Post.mediaItems` and `PostMedia` aligned until the UI fully migrates

## Performance Notes

Current performance-sensitive access patterns:

- session lookup by hashed token
- post queue lookup by `userId`, `status`, and `scheduledTime`
- Instagram token refresh candidates by `connected` and `tokenExpiresAt`
- media lookup by `postId`
- publication attempt lookup by `postId` or `userId`
- automation run lookup by `job` or `userId`

Recommended future indexes if usage grows:

- `Post(userId, createdAt desc)`
- partial indexes for failed or retryable publication attempts

## Security Notes

Sensitive data currently protected at rest includes:

- email representation
- Instagram user id
- Instagram username
- Instagram access token

Security design rules:

- do not store plaintext secrets in frontend-accessible storage
- do not log encrypted values or raw secrets unnecessarily
- keep encryption key only in server environment variables

## Storage vs Database Boundary

The database does not store image binary payloads.

Instead it stores references such as:

- `imageUrl`
- `imagePath`
- `mediaItems[].imageUrl`
- `mediaItems[].imagePath`
- `mediaItems[].previewUrl`

Binary assets live in:

- Supabase Storage in production-like configuration
- local filesystem fallback in non-durable local mode

## Migration Guidelines

When changing the schema:

1. update `prisma/schema.prisma`
2. run `npm run db:generate`
3. run `npm run db:push`
4. update this document if entities, relationships, or constraints changed
5. review indexes for read-heavy paths

## Operational Notes

- cascade delete is active across user-owned relational data
- removing a local post record does not remove an Instagram post already published externally
- cron automation depends on accurate `status` and `scheduledTime`
- scheduled publishing should run frequently enough to catch due posts close to their intended time
- publication attempts and automation runs are operational audit data and may need retention policies later

## Summary

The schema now supports multi-user editorial automation, normalized media metadata, publication attempt auditing, and cron run visibility while keeping JSON compatibility for existing UI flows. The main long-term architectural decision point is when to migrate readers fully from `Post.mediaItems` to `PostMedia` and whether heavy AI/rendering work should move into a durable job queue.
