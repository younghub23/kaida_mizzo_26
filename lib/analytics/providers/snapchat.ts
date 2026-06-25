// ============================================================================
// SNAPCHAT ANALYTICS PROVIDER (infrastructure — not yet integrated)
// ----------------------------------------------------------------------------
// Wired into the loader so it activates once a real Snapchat data source exists.
// Snapchat's public API (the Marketing API) is ad-account oriented and does not
// expose organic content/follower analytics the way the other networks do, so
// there's no reliable organic metric to surface yet — this provider returns
// `null` (→ the channel is simply skipped) until an integration is built.
//
// To integrate later: use the Snapchat Marketing API with the connected org /
// ad account (token stored by app/api/social/snapchat/callback), pull the
// available stats, and return real PlatformAnalytics. Every call must stay
// defensive (return null on any failure) — never fabricate numbers.
// See app/(dashboard)/analytics/INTEGRATION.md.
// ============================================================================

import { logError } from '@/lib/log'
import { fetchJson, type PlatformAnalytics, type ConnectedAccount } from '@/lib/analytics/providers/util'

const API = 'https://adsapi.snapchat.com/v1'

export async function fetchSnapchat(account: ConnectedAccount): Promise<PlatformAnalytics | null> {
  try {
    // Verify the token resolves an identity (keeps the wiring honest); there is
    // no organic content/follower analytics endpoint to read yet.
    await fetchJson<{ me?: { id?: string } }>(`${API}/me`, {
      headers: { Authorization: `Bearer ${account.access_token}` },
    }).catch(() => null)
    return null
  } catch (err) {
    logError('analytics/snapchat', 'Snapchat live fetch failed; using fallback', err)
    return null
  }
}
