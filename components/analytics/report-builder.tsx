'use client'

import { useState } from 'react'
import { LayoutGrid, FileDown, FileText, FileSpreadsheet, Presentation, GripVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/analytics/data-source'
import { REPORT_WIDGETS, EXPORT_FORMATS, type ExportFormat } from '@/app/(dashboard)/analytics/mock-data'
import { cn } from '@/lib/utils'

const EXPORT_ICON: Record<ExportFormat, React.ComponentType<{ className?: string }>> = {
  PDF: FileText,
  CSV: FileSpreadsheet,
  PowerPoint: Presentation,
}

export function ReportBuilder() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(REPORT_WIDGETS.map((w) => [w.id, w.defaultOn]))
  )
  const [whiteLabel, setWhiteLabel] = useState(false)

  return (
    <Section
      title="Custom report builder"
      icon={LayoutGrid}
      iconColor="#9A6E16"
      eyebrow="Reporting"
      source="User config (mock) — export renders server-side"
      description="Toggle the widgets to include, add your branding, and export. Drag-and-drop ordering and export are mocked for now."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-fredoka font-semibold">Widgets</CardTitle>
            <CardDescription>Choose what appears in the exported report.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {REPORT_WIDGETS.map((w) => (
              <label
                key={w.id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                  // Enabled rows pick up a soft bougainvillea wash + tinted edge;
                  // disabled rows stay on the plain warm hairline.
                  enabled[w.id]
                    ? 'border-[rgba(214,73,140,.25)] bg-[rgba(214,73,140,.06)]'
                    : 'border-border hover:bg-[rgba(164,141,120,.06)]'
                )}
              >
                <GripVertical className="size-4 text-muted-foreground" aria-hidden />
                <input
                  type="checkbox"
                  checked={enabled[w.id]}
                  onChange={() => setEnabled((s) => ({ ...s, [w.id]: !s[w.id] }))}
                  className="size-4 accent-[#D6498C]"
                />
                <span className="flex-1">{w.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-fredoka font-semibold">Export</CardTitle>
            <CardDescription>Download a snapshot of the selected widgets.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {EXPORT_FORMATS.map((fmt) => {
              const Icon = EXPORT_ICON[fmt]
              return (
                <Button key={fmt} variant="outline" className="justify-start" disabled title="Export coming soon">
                  <Icon className="size-4" />
                  Export as {fmt}
                  <FileDown className="ml-auto size-4 opacity-50" />
                </Button>
              )
            })}

            <label className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span>
                White-label branding
                <span className="block text-xs text-muted-foreground">Hide Tala logo on exports</span>
              </span>
              <input
                type="checkbox"
                checked={whiteLabel}
                onChange={() => setWhiteLabel((v) => !v)}
                className="size-4 accent-[#D6498C]"
              />
            </label>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
