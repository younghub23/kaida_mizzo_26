# Analytics — data integration status

The `/analytics` page pulls **live data when an account is connected** and a
provider succeeds. Otherwise it shows **real data only** — sections with no
connected source render an empty "connect an account" state, **never fake
numbers**, in every environment.

This is controlled by `lib/analytics/config.ts` (`ALLOW_MOCK_ANALYTICS`): mock
data is **off by default** and only turns on when
`NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK` is set to the string `'true'` — a deliberate
opt-in for local building & demoing. Anything else keeps the page real-only.

## How data flows

```
page.tsx (server)
  └─ loadAnalytics()                         lib/analytics/load.ts
        ├─ baseline: mock (dev) / empty (prod)
        ├─ read connected accounts           social_accounts (Supabase, RLS)
        ├─ dispatch to per-network provider  lib/analytics/providers/*
        └─ recompute "All" aggregate if live
  └─ <AnalyticsDashboard data=… />           client filter selects per network
```

Providers never throw — any failure returns `null` and the loader keeps the
baseline. The page cannot break because a fetch failed.

## Provider status

| Network | Provider | Status |
| --- | --- | --- |
| Instagram / Facebook | `providers/meta.ts` | **Live** — follower count, follower growth (`page_daily_follows`) and posts from Graph API v23, using the already-granted scopes (no App Review). Page-level reach/impressions were deprecated by Meta and are omitted (never faked). |
| Google (GA4) | `providers/google.ts` | **Implemented** — KPIs from the GA4 Data API. Connect flow built; needs a Google OAuth app + App Verification. |
| LinkedIn | `providers/linkedin.ts` | **Scaffolded** — wired up but inactive until org scopes are granted. Falls back today (intended). |
| TikTok | `providers/tiktok.ts` | **Scaffolded** — wired up but inactive until analytics scopes are granted. Falls back today (intended). |

Each network section's "Source:" badge shows `(live)`, `(mock)`,
`(live + mock)`, or `(not connected)` so the real state is always visible.

Providers also expose an optional `followers` roster (`PlatformAnalytics.followers`)
for the cross-channel matcher; every provider returns `null` today (no platform
API exposes a roster). See **Cross-channel followers** below.

Sections with no provider yet (trend chart, audience demographics, best-time
(Claude), competitor benchmark, ROI/UTM, social listening) render empty
"connect an account" states until a real provider is added — unless mock is
explicitly opted in for local previewing.

## Cross-channel followers

Finds people who follow the brand on 2+ networks under near-duplicate
identities (e.g. Instagram `@jane.eyre` + TikTok `@jane_eyre`) and surfaces them
as **potential** matches with a confidence score — never confirmed identities.

Data flow:

```
loadAnalytics()                                   lib/analytics/load.ts
  ├─ each provider may return a `followers` roster (PlatformAnalytics.followers)
  ├─ collect LIVE rosters from connected providers → liveRosters[]
  ├─ matchCrossChannelFollowers(rosters)           lib/analytics/cross-channel.ts
  │     normalize handle/name/bio → blend (Levenshtein + Jaccard) →
  │     union-find groups → keep groups spanning 2+ distinct platforms
  └─ tag the section live / mock / empty (never mix live + mock followers)
        ├─ live rosters present        → matcher over live data        (live)
        ├─ else ALLOW_MOCK_ANALYTICS   → matcher over the dev sample    (mock)
        └─ else (production, no source) → empty "connect an account"    (empty)
```

The matcher (`lib/analytics/cross-channel.ts`) is **pure and deterministic** (no
`Math.random()` / `Date.now()`), so it produces identical output on the server
and client. The UI is `components/analytics/cross-channel-followers.tsx`
(potential-matches banner, summary cards, ranked list with per-platform @handle
chips, match reason, and a confidence badge), wired into the dashboard between
Audience insights and Best times and listed in the report builder.

**Status: not live.** No platform API exposes a follower roster today, so every
provider returns `followers: null` (documented inline in each `providers/*`).
That `null` is the **activation point**: once a real follower source is wired in
(a provider returns a `followers` array), matching runs against live data
automatically — no UI change. Until then the section uses the dev-only sample
roster in `mock-data.ts` (`getSampleFollowerRosters()`) in development and an
empty state in production.

## Database

`social_accounts` columns used: `platform`, `platform_user_id`, `access_token`,
`refresh_token`, `token_expires_at`, `username`.

Two migrations were applied:
- `add_google_to_social_accounts_platform_check` — allow `platform = 'google'`.
- `social_accounts_unique_user_platform` — unique `(user_id, platform)` so the
  callbacks' `upsert(onConflict: 'user_id,platform')` works (it previously had
  no matching constraint).

The connect callbacks were also fixed to write `username`/`platform_user_id`
(the real columns) instead of a non-existent `account_name`.

## To make each platform actually go live

### Meta (Instagram + Facebook)
Already live on Graph API **v23** with the current connect scopes
(`pages_show_list`, `pages_read_engagement`, `instagram_basic`,
`instagram_content_publish`): follower count, follower growth
(`page_daily_follows`) and posts. No App Review is required for these.

Not available from Meta's current API, so intentionally omitted (not faked):
- Page-level **reach / impressions** — the old `page_impressions*` /
  `page_fan_adds` metrics were deprecated; there is no page-level replacement.
- Per-post reach — would need a per-post insights call (`read_insights`, App
  Review). To add it later, request that scope, then have existing connections
  **reconnect**, and verify metric names against the current Graph version.

### Google (GA4)
1. Create an OAuth client (Google Cloud Console), enable the **Google Analytics
   Admin API** and **Google Analytics Data API**.
2. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`; authorized redirect URI:
   `<NEXT_PUBLIC_APP_URL>/api/social/google/callback`.
3. Submit for **Google OAuth verification** (sensitive `analytics.readonly`
   scope).
4. The provider uses the first accessible GA4 property; to target a specific
   one, store its id (`properties/123`) in `social_accounts.platform_user_id`
   (a property-picker UI would set this).

### LinkedIn (later)
Add org scopes `r_organization_social` (+ `rw_organization_admin`) to
`app/api/social/linkedin/connect/route.ts` and apply for LinkedIn Marketing
Developer Platform access. The provider then activates automatically.

### TikTok (later)
Add scopes `user.info.stats` and `video.list` to
`app/api/social/tiktok/connect/route.ts`. Note tokens expire in ~24h — the
`refresh_token` is stored; add refresh handling like the Google provider.

## Future work

- Live providers for the remaining mock-only sections (trend, audience, ROI…).
- Cache live results (e.g. an `analytics_snapshots` table) and refresh on a
  schedule rather than fetching on every page load.
- A GA4 property-picker and a token-refresh writer that persists refreshed
  tokens back to `social_accounts`.
