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

// Each widget row carries the theme colour of the section it represents, so the
// checklist reads as a legend for the page's data-viz palette. Falls back to
// bougainvillea for anything unmapped.
const WIDGET_COLOR: Record<string, string> = {
  kpis: '#D6498C',
  trend: '#36B7C0',
  'top-content': '#E08A3C',
  posts: '#1E7B82',
  audience: '#3A6E92',
  'cross-channel': '#A82C66',
  'best-time': '#E08A3C',
  competitors: '#3A6E92',
  roi: '#5E8C3E',
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
      iconColor="#B58A1E"
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
            {REPORT_WIDGETS.map((w) => {
              const color = WIDGET_COLOR[w.id] ?? '#D6498C'
              return (
                <label
                  key={w.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors',
                    !enabled[w.id] && 'border-border hover:bg-[rgba(164,141,120,.06)]'
                  )}
                  // Enabled rows pick up a soft wash + tinted edge in that
                  // widget's category colour; disabled rows keep the warm hairline.
                  style={
                    enabled[w.id]
                      ? { borderColor: `${color}40`, background: `${color}12` }
                      : undefined
                  }
                >
                  <GripVertical className="size-4 text-muted-foreground" aria-hidden />
                  <input
                    type="checkbox"
                    checked={enabled[w.id]}
                    onChange={() => setEnabled((s) => ({ ...s, [w.id]: !s[w.id] }))}
                    className="size-4"
                    style={{ accentColor: color }}
                  />
                  <span className="flex-1">{w.label}</span>
                </label>
              )
            })}
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
