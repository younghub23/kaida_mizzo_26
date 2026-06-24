# Analytics — data integration status

The `/analytics` page pulls **live data when an account is connected** and a
provider succeeds. Otherwise:

- **Development / preview** → falls back to **mock** data (so we can build & demo).
- **Production (live site)** → shows **real data only**; sections with no
  connected source render an empty "connect an account" state — never fake
  numbers.

This is controlled by `lib/analytics/config.ts` (`ALLOW_MOCK_ANALYTICS`):
mock is on when `NODE_ENV !== 'production'`, overridable with
`NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK` (`'true'`/`'false'`).

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
| Instagram / Facebook | `providers/meta.ts` | **Implemented** — KPIs + posts from the Graph API. Needs Meta App Review for insights scopes (below). |
| Google (GA4) | `providers/google.ts` | **Implemented** — KPIs from the GA4 Data API. Connect flow built; needs a Google OAuth app + App Verification. |
| LinkedIn | `providers/linkedin.ts` | **Scaffolded** — wired up but inactive until org scopes are granted. Falls back today (intended). |
| TikTok | `providers/tiktok.ts` | **Scaffolded** — wired up but inactive until analytics scopes are granted. Falls back today (intended). |

Each network section's "Source:" badge shows `(live)`, `(mock)`,
`(live + mock)`, or `(not connected)` so the real state is always visible.

Sections still mock-only (no provider yet): trend chart, audience demographics,
best-time (Claude), competitor benchmark, ROI/UTM, social listening. In
production these render empty states until a provider is added.

### Cross-channel followers

Finds people who follow you on 2+ networks under slightly different identities
(e.g. Instagram `@jane.eyre` and TikTok `@jane_eyre`). Providers contribute a
`followers` roster (`FollowerProfile` = handle + name + bio) via
`PlatformAnalytics`; `loadAnalytics()` runs `lib/analytics/cross-channel.ts`
(normalize + Levenshtein + Jaccard, union-find grouping) over the **combined
live rosters** and returns the matched people, tagged `live`/`mock`/`empty`.

Results are surfaced as **potential** matches (a confidence score, never a
confirmed identity). Today every provider returns `followers: null` — the major
platform APIs (Meta/TikTok/LinkedIn) don't expose follower rosters with profile
details — so the section shows mock in dev and an empty state in prod. It
activates automatically once any provider returns a real roster (e.g. a
permitted follower endpoint, a CSV/audience-tool import, or a partner API).

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
1. Scopes are set in `app/api/social/meta/connect/route.ts`
   (`read_insights`, `instagram_manage_insights`).
2. Submit for **Meta App Review** (advanced permissions).
3. Existing connections must **reconnect** to grant the new scopes.
4. Verify Graph API metric names against the current version (`v19.0`).

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
