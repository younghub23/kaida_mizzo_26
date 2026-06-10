'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)

    const res = await fetch('/api/checkout', { method: 'POST' })
    const { url } = await res.json()

    if (url) {
      window.location.href = url
    } else {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Redirecting...' : 'Upgrade'}
    </Button>
  )
}
