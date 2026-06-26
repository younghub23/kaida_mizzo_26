'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopBar } from '@/components/dashboard/top-bar'
import { DashboardChat } from '@/components/dashboard/dashboard-chat'

// Shared dashboard chrome: a top bar across the top, a collapsible sidebar, and
// the routed page content. The collapse state lives here so the top-bar
// hamburger can drive the sidebar; the chat-popover state lives here too so the
// top-bar chat button can toggle it.
export function DashboardShell({
  businessName,
  children,
}: {
  businessName: string
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onToggleChat={() => setChatOpen((o) => !o)}
      />
      <div className="flex flex-1">
        <Sidebar businessName={businessName} collapsed={collapsed} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <DashboardChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
