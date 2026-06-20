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
