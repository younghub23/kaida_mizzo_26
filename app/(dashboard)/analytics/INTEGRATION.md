# Analytics — data integration status

The `/analytics` page is **integration-ready with mock fallback**. Every section
pulls **live data when the customer has connected that account** and the
platform provider succeeds; otherwise it falls back to **mock** data and the
section's "Source:" badge shows `(mock)`.

## How data flows

```
page.tsx (server)
  └─ loadAnalytics()                         lib/analytics/load.ts
        ├─ seed every network with mock      app/(dashboard)/analytics/mock-data.ts
        ├─ read connected accounts           social_accounts (Supabase, RLS)
        ├─ fetchMetaPlatformAnalytics()      lib/analytics/providers/meta.ts
        └─ recompute "All" aggregate if live aggregateKpis()
  └─ <AnalyticsDashboard data=… />           client filter selects per network
```

- The page never breaks on a data-source failure — any error falls back to mock
  (see the try/catch in `load.ts` and per-call guards in `providers/meta.ts`).
- To swap a section to real data, add a provider and overlay it in `load.ts`.
  The UI components don't change.

## What's live today

| Section | Instagram / Facebook | LinkedIn / TikTok / Google |
| --- | --- | --- |
| Core KPI cards | **live** (Meta Graph API) | mock |
| Post performance / Top content | **live** (recent media/posts) | mock |
| Trend chart | mock | mock |
| Audience, Best-time, Competitors, ROI, Listening | mock | mock |

KPI cards override only the metrics the API returns; unmapped metrics keep their
mock value, so cards stay complete.

## To make Meta data actually flow in production

1. **Add the scopes** (already added to `app/api/social/meta/connect/route.ts`):
   - Instagram: `instagram_basic`, `instagram_manage_insights`
   - Facebook: `pages_read_engagement`, `read_insights`
2. **Meta App Review** — these are advanced permissions and must be approved by
   Meta before they work for non-test users.
3. **Re-consent** — accounts connected before the scope change must reconnect.
4. **Verify Graph API field/metric names** against the current API version
   (`v19.0` here). Metric names (`page_impressions`, `reach`, `follower_count`,
   media `insights.metric(reach)`, etc.) drift between versions; confirm during
   rollout. Unverified metrics simply fall back to the mock value.

## Extending to other networks

Add a provider under `lib/analytics/providers/` (mirror `meta.ts`: return
`{ kpis, posts } | null`, never throw) and overlay it in `load.ts`:

- **LinkedIn** — Marketing Developer Platform; organization share statistics +
  follower statistics. Token already stored on `social_accounts`.
- **TikTok** — Display/Business API video + audience analytics.
- **Google** — Google Analytics 4 Data API (for ROI/UTM) + Business Profile.

## Notes / future work

- Trend, audience demographics, best-time (Claude model), competitor
  benchmarking, ROI/UTM, and social listening are still mock. Audience and
  trend are reachable from the Meta APIs with more work; competitors and
  listening require third-party providers.
- Consider caching live results in a table (e.g. `analytics_snapshots`) and
  refreshing on a schedule instead of fetching on every page load.
