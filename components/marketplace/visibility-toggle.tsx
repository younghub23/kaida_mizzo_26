'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { setMarketplaceVisibility } from '@/app/actions/marketplace'

// Compact discoverability switch for the marketplace header. Reflects and edits
// profiles.marketplace_visible — when off, the user is hidden from the directory.
export function VisibilityToggle({ initial }: { initial: boolean }) {
  const [visible, setVisible] = useState(initial)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !visible
    setVisible(next) // optimistic
    startTransition(async () => {
      const res = await setMarketplaceVisibility(next)
      if (res.error) {
        setVisible(!next)
        toast.error('Could not update visibility')
      } else {
        toast.success(next ? "You're discoverable in the marketplace" : "You're hidden from the marketplace")
      }
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={visible}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-60"
      title={visible ? 'Visible in the marketplace' : 'Hidden from the marketplace'}
    >
      {visible ? (
        <Eye className="size-3.5 text-[#1E7B82]" />
      ) : (
        <EyeOff className="size-3.5 text-muted-foreground" />
      )}
      <span className="text-foreground">{visible ? 'Discoverable' : 'Hidden'}</span>
      <span
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
          visible ? '' : 'bg-input'
        }`}
        style={visible ? { background: 'linear-gradient(120deg,#D6488C,#E08A3C)' } : undefined}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-white transition-all ${
            visible ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}
