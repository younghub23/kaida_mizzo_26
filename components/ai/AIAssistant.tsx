'use client'

import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type AIGenerateType = 'social' | 'email_subject' | 'email_body'

const TYPE_OPTIONS: { value: AIGenerateType; label: string }[] = [
  { value: 'social', label: 'Social Caption' },
  { value: 'email_subject', label: 'Email Subject' },
  { value: 'email_body', label: 'Email Body' },
]

type AIAssistantProps = {
  isOpen: boolean
  onClose: () => void
  onSelect: (text: string) => void
  defaultType?: AIGenerateType
}

export function AIAssistant({ isOpen, onClose, onSelect, defaultType = 'social' }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState<AIGenerateType>(defaultType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])

  if (!isOpen) return null

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setOptions([])

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      setOptions(data.options)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(text: string) {
    onSelect(text)
    onClose()
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col gap-4 border-l border-border bg-background p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">AI Assistant</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ai-type">Content Type</Label>
        <select
          id="ai-type"
          value={type}
          onChange={(e) => setType(e.target.value as AIGenerateType)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ai-prompt">What do you want to create?</Label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="e.g. Announce our summer sale, 20% off all items this weekend"
          className="w-full resize-none rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate'
        )}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {options.length > 0 && (
        <div className="flex flex-col gap-2 overflow-y-auto">
          <p className="text-sm text-muted-foreground">Click an option to use it:</p>
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              className={cn(
                'rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
