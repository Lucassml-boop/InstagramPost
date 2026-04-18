# AI Ads Architecture

## Objective

This module extends the current automation workspace into an AI-guided paid traffic operating system.

The main shift is:

- from optimizing isolated ad metrics
- to optimizing business profit with safety controls

## Current MVP In This Repository

The current implementation adds:

- a protected page at `/ai-ads`
- a saved Meta Ads account configuration per user
- a Meta Ads sync flow backed by the Graph API
- a structured JSON contract for campaign analysis
- a server-side decision engine in `lib/ai-ads.ts`
- a sync orchestration layer in `lib/meta-ads.ts`
- safety validation before any execution plan is emitted
- persisted sync runs, campaign snapshots, and decision logs
- a sample payload with audiences, creatives, margins, stock, and trends
- an API route at `POST /api/ai-ads/analyze`
- API routes for account save, sync, and latest dashboard hydration

This MVP is still intentionally conservative on execution.
It now reads from Meta Ads directly, but it does not yet auto-apply budget changes back into Meta.

## Professional Operating Loop

The decision engine follows this loop:

1. Data collection from Ads APIs
2. Business enrichment with margin, ticket, stock, and campaign goals
3. Analysis over performance, structure, context, and trend
4. Decision generation
5. Safety validation
6. Execution plan emission
7. Impact monitoring
8. Learning persistence

## What The Engine Analyzes

### 1. Basic performance

- CTR
- CPC
- CPM
- conversions
- CPA
- ROAS
- impressions
- frequency

### 2. Campaign structure

- best audience
- weakest audience
- creative fatigue
- scale concentration
- budget reallocation opportunities

### 3. Business context

- profit margin
- average ticket
- estimated revenue
- estimated profit
- stock pressure
- seasonality

### 4. Behavior over time

- rising trend
- stable trend
- falling trend
- fatigue signs driven by trend plus frequency

## Decision Types

The engine currently emits these actions:

- `pause`
- `increase_budget`
- `decrease_budget`
- `reallocate_budget`
- `test_new_creative`
- `duplicate_campaign`
- `keep_running`

## Safety Rules

Current guardrails:

- budget increases are capped by `maxBudgetIncreasePct`
- new campaigns are frozen for structural and budget changes for `newCampaignFreezeDays`
- campaigns above `neverPauseAboveConversions` are blocked from automatic pause

Blocked actions remain visible in the analysis output so the operator can review them manually.

## Contract Shape

Main input sections:

- `objective`
- `executionMode`
- `businessContext`
- `safetyRules`
- `campaigns`

Each campaign supports:

- performance metrics
- audience breakdown
- creative breakdown
- margin and revenue context
- trend and stock information

## Recommended Next Steps

### Phase 1

- connect Meta Ads API
- ingest campaign, ad set, and creative metrics
- map account-level business goals to the payload

### Phase 2

- persist historical snapshots in the database
- compare before/after every approved action
- build a recommendation audit trail

### Phase 3

- connect business systems such as CRM, ERP, or ecommerce data
- calibrate the scoring model from historical results
- add predictive recommendations
- allow safe auto-execution for narrow action classes

## Suggested Future Persistence Model

When you are ready to persist AI Ads natively, create entities such as:

- `AdAccount`
- `AdCampaignSnapshot`
- `AdAudienceSnapshot`
- `AdCreativeSnapshot`
- `AdDecisionLog`
- `AdExecutionLog`
- `AdLearningFeedback`

This keeps the current MVP compatible with future production expansion without rewriting the decision layer.
