// ============================================================================
// Analytics data-source policy
// ----------------------------------------------------------------------------
// Mock data is shown ONLY while building/previewing (non-production). On the
// live site the analytics page shows REAL data exclusively — any section with
// no connected source renders an empty "connect an account" state instead of
// placeholder numbers.
//
// Override explicitly with NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK = 'true' | 'false'
// (must be NEXT_PUBLIC_ so the value is consistent on server and client).
// ============================================================================

const override = process.env.NEXT_PUBLIC_ANALYTICS_ALLOW_MOCK

export const ALLOW_MOCK_ANALYTICS =
  override === 'true'
    ? true
    : override === 'false'
      ? false
      : process.env.NODE_ENV !== 'production'
