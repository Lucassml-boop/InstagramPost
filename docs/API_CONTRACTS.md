# API Contracts

## Overview

This document defines the current REST-style API contracts exposed by the application.

## Contract Style

### Current Response Pattern

The current codebase uses a mixed response style:

- success responses usually return `200` with route-specific payloads
- error responses usually return:

```json
{
  "error": "Human-readable message"
}
```

### Recommended Future Standard

For long-term consistency, the preferred contract should converge to:

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
  "error": "Human-readable message"
}
```

## Authentication

### POST `/api/auth/login`

Creates or reuses a local user account and starts a session.

Request:

```json
{
  "email": "reviewer@example.com",
  "password": "123456"
}
```

Success response:

```json
{
  "ok": true
}
```

Possible errors:

- invalid email
- password shorter than 6 characters
- invalid credentials for an existing user

### POST `/api/auth/logout`

Destroys the current session cookie and server-side session record.

Success response:

```json
{
  "ok": true
}
```

### GET `/api/auth/instagram`

Starts the Instagram OAuth redirect flow.

Behavior:

- requires authenticated local session
- redirects the browser to Instagram authorization

### GET `/api/auth/instagram/callback`

Completes Instagram OAuth callback.

Behavior:

- validates state
- exchanges code for token
- fetches Instagram profile
- stores encrypted connection data
- redirects user back into the application

## Posts

### POST `/api/posts/generate`

Generates caption, hashtags, layout, renders images, and creates a draft post.

Request:

```json
{
  "topic": "Automation",
  "message": "Promote operational efficiency",
  "tone": "professional",
  "postType": "feed",
  "carouselSlideCount": 3,
  "carouselSlideContexts": [],
  "outputLanguage": "en",
  "customInstructions": "",
  "brandColors": "#101828, #d62976",
  "keywords": "ecommerce, automation"
}
```

Success response shape:

```json
{
  "postId": "post_xxx",
  "postType": "feed",
  "mediaItems": [
    {
      "imageUrl": "/generated/example.jpg",
      "imagePath": "supabase://bucket/generated/example.jpg",
      "previewUrl": "https://..."
    }
  ],
  "imageUrl": "/generated/example.jpg",
  "imagePath": "supabase://bucket/generated/example.jpg",
  "caption": "Generated caption",
  "hashtags": ["#tag1", "#tag2"],
  "htmlLayout": "{\"html\":\"...\",\"css\":\"...\"}"
}
```

Possible errors:

- unauthorized
- validation failure
- AI timeout
- rendering failure
- storage failure

### POST `/api/posts/publish`

Publishes a draft or existing post immediately.

Request:

```json
{
  "postId": "post_xxx",
  "caption": "Updated caption",
  "postType": "feed",
  "mediaItems": [
    {
      "imageUrl": "https://public-url/image.jpg",
      "imagePath": "supabase://bucket/generated/image.jpg",
      "previewUrl": "https://public-url/preview.jpg"
    }
  ]
}
```

Success response:

```json
{
  "ok": true,
  "postId": "post_xxx"
}
```

Possible errors:

- unauthorized
- post not found
- invalid media count
- media URL not publicly reachable
- missing Instagram connection
- Instagram API error

### POST `/api/posts/schedule`

Schedules a post for future publishing or reschedules an existing one.

Request:

```json
{
  "postId": "post_xxx",
  "caption": "Caption text",
  "scheduledTime": "2026-04-10T14:30:00.000Z",
  "postType": "feed",
  "mediaItems": [
    {
      "imageUrl": "https://public-url/image.jpg",
      "imagePath": "supabase://bucket/generated/image.jpg",
      "previewUrl": "https://public-url/preview.jpg"
    }
  ]
}
```

Success response:

```json
{
  "ok": true
}
```

### POST `/api/posts/delete`

Deletes local post records shown in the scheduled posts screen.

Important rule:

- this removes only the local database record
- it does not delete already published posts from Instagram

Request:

```json
{
  "postIds": ["post_1", "post_2"]
}
```

Success response:

```json
{
  "ok": true,
  "deletedCount": 2
}
```

### POST `/api/posts/upload-image`

Uploads a user-provided image to storage and returns storage references.

Request:

- `multipart/form-data`
- fields:
  - `file`
  - `markAsAiGenerated`

Success response:

```json
{
  "imageUrl": "https://public-url/image.jpg",
  "imagePath": "supabase://bucket/uploads/image.jpg",
  "previewUrl": "https://public-url/preview.jpg"
}
```

## User Settings

### POST `/api/user/generation-settings`

Updates user generation preferences.

Request:

```json
{
  "outputLanguage": "pt-BR",
  "customInstructions": "You are an expert Instagram strategist."
}
```

Success response:

```json
{
  "outputLanguage": "pt-BR",
  "customInstructions": "You are an expert Instagram strategist."
}
```

## Content System

### GET `/api/content-system/agenda`

Returns current agenda data for the authenticated user context.

### GET `/api/content-system/brand-profile`

Returns current stored brand profile.

### POST `/api/content-system/brand-profile`

Updates brand profile and related content automation inputs.

### GET `/api/content-system/topics-history`

Returns saved topics history.

### POST `/api/content-system/topics-history`

Clears stored topics history.

### POST `/api/content-system/generate-weekly`

Generates a weekly content agenda.

### POST `/api/content-system/publish-weekly-preview`

Publishes the generated weekly agenda immediately for preview/testing purposes.

## Cron Routes

These routes are protected by:

- authenticated session, or
- `Authorization: Bearer <CRON_SECRET>`, or
- `x-cron-secret: <CRON_SECRET>`

### GET `/api/cron/generate-weekly-content`

Runs weekly content generation automation.

Example response:

```json
{
  "generated": true,
  "agendaSize": 5
}
```

### GET `/api/cron/clear-topics-history`

Runs automated cleanup of topic history when due.

### POST `/api/cron/publish-scheduled`

Processes due scheduled posts.

Example response:

```json
{
  "processed": 3
}
```

### POST `/api/cron/refresh-instagram-tokens`

Refreshes connected Instagram long-lived tokens.

Example response:

```json
{
  "refreshed": 1
}
```

## Validation Rules

Main backend validation is implemented with Zod.

Important rules:

- `login.password` minimum length: 6
- `generatePost.topic` minimum length: 2
- `generatePost.message` minimum length: 2
- `carouselSlideCount` between 2 and 10
- `schedulePost.scheduledTime` must be ISO datetime
- `deletePosts.postIds` accepts 1 to 100 items

## Error Semantics

Common status patterns:

- `200`: success
- `400`: validation or business rule failure
- `401`: unauthorized
- `500`: missing required server configuration or unexpected server failure
- `504`: upstream timeout during generation flow

## Frontend Consumption Guidelines

- use `fetch` with explicit `Content-Type: application/json` for JSON endpoints
- always parse JSON and check `response.ok`
- show loading state for all mutations
- display friendly error feedback
- treat `error` as the current source of truth for failure text

## Maintenance Rule

Whenever a route contract changes, this file must be updated in the same change set.
