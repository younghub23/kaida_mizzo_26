'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import type { AccountType } from '@/lib/account'

// Shared dashboard chrome, matching dashboard-reference.html:
//   .app (flex) → full-height Sidebar (with its own logo head) + main column
//   whose sticky TopBar sits only above the routed content.
//
// Collapse + mobile-drawer state lives here so the top-bar hamburger can drive
// the sidebar: on desktop it toggles the 74px icon rail (.app.collapsed); on
// ≤640px it slides the off-canvas drawer (.app.mobile-open).
export function DashboardShell({
  businessName,
  businessSub,
  userInitial,
  accountType = 'business',
  unreadMessages = 0,
  children,
}: {
  businessName: string
  businessSub: string
  userInitial: string
  accountType?: AccountType
  unreadMessages?: number
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Mirror the reference toggle: drawer on phones, icon rail on desktop.
  function toggleSidebar() {
    // 639.98px == Tailwind's `max-sm` cutoff, so the JS decision (drawer vs.
    // rail) always agrees with which CSS mode is actually active.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width:639.98px)').matches) {
      setMobileOpen((o) => !o)
    } else {
      setCollapsed((c) => !c)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        businessName={businessName}
        businessSub={businessSub}
        accountType={accountType}
        unreadMessages={unreadMessages}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userInitial={userInitial} onToggleSidebar={toggleSidebar} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
