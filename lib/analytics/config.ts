// ============================================================================
// Analytics data-source policy
// ----------------------------------------------------------------------------
// The analytics page shows REAL data ONLY — every metric is derived straight
// from the accounts a customer has connected to Tala (lib/analytics/providers/
// *). Any section without a connected, live source renders an empty "connect an
// account" state instead of placeholder/fake numbers — in every environment.
//
// Mock/demo data is therefore OFF by default. It can be turned on deliberately
// for local building/previewing by setting
// NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK = 'true' (must be NEXT_PUBLIC_ so the value
// is identical on server and client and hydration matches). Anything other
// than the explicit string 'true' keeps the page real-data-only.
// ============================================================================

export const ALLOW_MOCK_ANALYTICS =
  process.env.NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK === 'true'
