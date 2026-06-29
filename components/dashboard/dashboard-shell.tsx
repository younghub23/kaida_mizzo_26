'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { DashboardChat } from '@/components/dashboard/dashboard-chat'

// Shared dashboard chrome: a full-height sidebar on the left (Tala logo,
// workspace nav, business card) and a header bar over the routed page content.
// The collapse state lives here so the header hamburger can drive the sidebar;
// the chat-popover state lives here too so the header chat button can toggle it.
export function DashboardShell({
  businessName,
  planLabel,
  children,
}: {
  businessName: string
  planLabel: string
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="tala-theme flex min-h-screen bg-background text-foreground">
      <Sidebar
        businessName={businessName}
        planLabel={planLabel}
        collapsed={collapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          businessName={businessName}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onToggleChat={() => setChatOpen((o) => !o)}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <DashboardChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
