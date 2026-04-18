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
 |- MetaAdsAccount (1:1)
    |- MetaAdsSyncRun (1:N)
    |- MetaAdsCampaignSnapshot (1:N)
    |- MetaAdsDecisionLog (1:N)
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
- `createdAt`
- `updatedAt`

Business rules:

- posts are always scoped to one user
- the system stores the cover image separately from `mediaItems` for practical access
- `mediaItems` can represent feed, story, or carousel assets
- scheduled posts are selected by `status = SCHEDULED` and `scheduledTime <= now`
- deleting a post record removes local history only

Relationships:

- many posts belong to one user

Indexes and constraints:

- primary key on `id`
- index on `userId, status, scheduledTime`
- foreign key `userId -> User.id`

### 5. MetaAdsAccount

Purpose:

- stores the connected Meta Ads account reference per local user
- stores the encrypted Meta Ads access token
- stores default business context used to enrich campaign analysis

Main fields:

- `id`
- `userId`
- `adAccountId`
- `adAccountIdHash`
- `adAccountIdEncrypted`
- `adAccountIdIv`
- `adAccountIdTag`
- `accessToken`
- `accessTokenIv`
- `accessTokenTag`
- `connected`
- `lastSyncedAt`
- `defaultTargetCpa`
- `defaultTargetRoas`
- `defaultTicketAverage`
- `defaultProfitMargin`
- `defaultStockLevel`
- `defaultSeasonality`

Business rules:

- each user may have at most one Meta Ads account connected in this MVP
- ad account identifiers are persisted with the same privacy strategy used for Instagram identity data
- account-level business defaults are reused to enrich every synced campaign snapshot

### 6. MetaAdsSyncRun

Purpose:

- records each sync attempt against the Meta Ads API
- groups the campaign snapshots fetched in a single batch

Main fields:

- `id`
- `userId`
- `metaAdsAccountId`
- `status`
- `datePreset`
- `startedAt`
- `finishedAt`
- `campaignsFetched`
- `rawSummary`

### 7. MetaAdsCampaignSnapshot

Purpose:

- stores one persisted campaign snapshot per sync batch
- keeps normalized metrics ready for analysis plus the raw payload fragments used to derive them

Main fields:

- `syncRunId`
- `externalCampaignId`
- `name`
- `objective`
- `status`
- `budgetDaily`
- `spend`
- `impressions`
- `clicks`
- `ctr`
- `cpc`
- `cpm`
- `conversions`
- `cpa`
- `roas`
- `revenue`
- `frequency`
- `trend`
- `ticketAverage`
- `profitMargin`
- `stockLevel`
- `seasonality`
- `audiences`
- `creatives`
- `rawCampaign`
- `rawCurrentInsights`
- `rawPreviousInsights`

### 8. MetaAdsDecisionLog

Purpose:

- persists the exact AI payload and resulting analysis used in each recommendation cycle
- supports future audit, learning, and before/after comparison

Main fields:

- `id`
- `userId`
- `metaAdsAccountId`
- `syncRunId`
- `objective`
- `executionMode`
- `inputPayload`
- `analysis`
- `createdAt`

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

### User -> MetaAdsAccount

- cardinality: `1:1`
- delete behavior: cascade

### MetaAdsAccount -> MetaAdsSyncRun

- cardinality: `1:N`
- delete behavior: cascade

### MetaAdsAccount -> MetaAdsCampaignSnapshot

- cardinality: `1:N`
- delete behavior: cascade

### MetaAdsAccount -> MetaAdsDecisionLog

- cardinality: `1:N`
- delete behavior: cascade

## Normalization Analysis

### Current Compliance

The current schema is broadly aligned with third normal form:

- authentication data is separated from content data
- Instagram account data is separated from local user data
- session lifecycle is separated from user identity
- posts are separated from account connection details

### Controlled Exception

`Post.mediaItems` is stored as JSON rather than a normalized child table.

Reasonable benefits for the current phase:

- flexible structure for feed, story, and carousel media
- faster implementation
- reduced migration overhead during evolving product logic

Tradeoffs:

- weaker relational guarantees
- reduced query power
- harder indexing of individual media entries

## Recommended Future Normalization

If the media model becomes more important, introduce:

```txt
PostMedia
- id
- postId
- position
- imageUrl
- imagePath
- previewUrl
- mimeType
- sizeBytes
- width
- height
- createdAt
```

Recommended relationship:

- `Post 1:N PostMedia`

Benefits:

- stronger normalization
- easier preview queries
- media-specific retention rules
- easier asset deduplication and analytics

## Performance Notes

Current performance-sensitive access patterns:

- session lookup by hashed token
- post queue lookup by `userId`, `status`, and `scheduledTime`
- Instagram token refresh candidates by `connected` and `tokenExpiresAt`

Recommended future indexes if usage grows:

- `Post(userId, createdAt desc)`
- `Post(userId, publishedAt desc)`
- `Post(publishedMediaId)`

## Security Notes

Sensitive data currently protected at rest includes:

- email representation
- Instagram user id
- Instagram username
- Instagram access token
- Meta Ads ad account id
- Meta Ads access token

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

## Summary

The current schema is compact and well-suited for the current application scope. The main long-term architectural decision point is whether `mediaItems` should remain JSON or be promoted to a normalized child table once reporting, asset lifecycle management, or advanced querying become important.
