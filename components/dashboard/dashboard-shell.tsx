'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'

// Shared dashboard chrome: a top bar across the top, a collapsible sidebar, and
// the routed page content. The collapse state lives here so the top-bar
// hamburger can drive the sidebar.
export function DashboardShell({
  businessName,
  children,
}: {
  businessName: string
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar onToggleSidebar={() => setCollapsed((c) => !c)} />
      <div className="flex flex-1">
        <Sidebar businessName={businessName} collapsed={collapsed} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
