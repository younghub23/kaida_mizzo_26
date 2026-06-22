# Launch Checklist

Things to do/verify before opening Tala up to real users.

## Auth / Google OAuth
- [ ] **Publish the Google OAuth consent screen.**
      Google Cloud Console → APIs & Services → OAuth consent screen → **Publish app**.
      While it's in **"Testing"** mode, only the Google accounts added as *test users*
      can sign in with Google. Publishing lets any Google user sign in.
- [ ] Confirm the Google provider is enabled in Supabase
      (project **YCA Project** / `qpefuphlbspnkyxirsrh` → Authentication → Providers → Google)
      with a valid Client ID + Secret.
- [ ] Confirm the Supabase **Redirect URLs** (Authentication → URL Configuration) include:
  - `https://kaida1.ycatesting.com/auth/callback`
  - `http://localhost:3000/auth/callback`
- [ ] Set the Supabase **Site URL** to `https://kaida1.ycatesting.com`.

## General go-live
- [ ] Verify production environment variables are set on Cloudflare
      (Supabase, Anthropic, Stripe, social, Resend keys).
- [ ] Switch Stripe from test keys to live keys (and update the webhook endpoint).
- [ ] Smoke-test the full signup → dashboard flow on production.

## Social / Analytics integrations — set up API keys when the site is fully designed
> ⚠️ REMINDER (requested): once the website design is finalized, set up the API
> credentials for each platform below so the Analytics page and posting pull
> live data. Each connect flow stores a token in the `social_accounts` table;
> until a platform's keys + connect route exist, its card shows "Coming soon"
> and Analytics shows mock (dev) / empty (prod).

Already wired (just need credentials + platform approval):
- [ ] **Meta (Facebook + Instagram)** — `META_APP_ID`, `META_APP_SECRET`. Submit
      `read_insights` + `instagram_manage_insights` for Meta App Review, then reconnect.
- [ ] **Google (GA4)** — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Publish the
      OAuth consent screen (sensitive `analytics.readonly` scope). Tag already
      installed via `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- [ ] **LinkedIn** — `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`. Add org scopes
      (`r_organization_social`, `rw_organization_admin`) + Marketing Developer Platform access.
- [ ] **TikTok** — `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`. Add `user.info.stats`
      + `video.list` scopes; add token refresh.

Not built yet — need a connect/callback route + provider + keys (cards show "Coming soon"):
- [ ] **Snapchat** — Snap Marketing API (Snap Kit / Marketing API credentials).
- [ ] **X (Twitter)** — X API v2 OAuth 2.0 app (`X_CLIENT_ID`/`X_CLIENT_SECRET`); note API tier/pricing.
- [ ] **YouTube** — YouTube Data API (reuses Google OAuth; add the `youtube.readonly` scope).
- [ ] **Pinterest** — Pinterest API for business (`PINTEREST_APP_ID`/`PINTEREST_APP_SECRET`).
- [ ] **Other to consider** — Threads, Reddit, Bluesky, Google Business Profile.

When ready, ping me and I'll scaffold each connect route + analytics provider
(same pattern as `lib/analytics/providers/*` and `app/api/social/*`).
