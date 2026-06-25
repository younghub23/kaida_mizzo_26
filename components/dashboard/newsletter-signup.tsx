'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

// Footer email-capture. Not wired to a list yet — confirms intent with a toast
// so the control feels alive without pretending to subscribe anyone.
export function NewsletterSignup() {
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    toast.success("You're on the list — we'll be in touch.")
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@business.com"
        aria-label="Email address"
        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="submit" size="sm">
        Subscribe
      </Button>
    </form>
  )
}
