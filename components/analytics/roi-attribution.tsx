import { DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { type Network, type RoiRow } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatCurrency, sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { NETWORK_LABEL } from '@/components/analytics/network-meta'

export function RoiAttribution({
  network,
  rows: input,
  source,
}: {
  network: Network
  // Brand-level attribution rows (live from GA4 campaigns + revenue), filtered
  // to the selected network here.
  rows: RoiRow[]
  source: SectionSource
}) {
  const rows = network === 'all' ? input : input.filter((r) => r.platform === network)
  const totals = rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + r.clicks,
      conversions: acc.conversions + r.conversions,
      revenue: acc.revenue + r.revenue,
    }),
    { clicks: 0, conversions: 0, revenue: 0 }
  )

  return (
    <Section
      title="ROI &amp; conversion attribution"
      icon={DollarSign}
      source={`UTM via GA4 + revenue ${sourceSuffix(source)}`}
      description="UTM-tagged clicks, conversions, and revenue attributed back to the campaign that drove them."
    >
      {source === 'empty' ? (
        <EmptyState message="Revenue attribution appears once Google Analytics (with UTM campaigns) is connected." />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Campaign</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>UTM campaign</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.postId}>
                    <TableCell className="font-medium">
                      <span className="line-clamp-1">{r.caption}</span>
                    </TableCell>
                    <TableCell>{NETWORK_LABEL[r.platform]}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {r.utmCampaign}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCompact(r.clicks)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.conversions}</TableCell>
                    <TableCell
                      className="text-right font-medium tabular-nums"
                      style={{ color: '#1E7B82' }}
                    >
                      {formatCurrency(r.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No attributed revenue for this network yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {rows.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-fredoka font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCompact(totals.clicks)}</TableCell>
                    <TableCell className="text-right tabular-nums">{totals.conversions}</TableCell>
                    <TableCell
                      className="text-right font-fredoka font-semibold tabular-nums"
                      style={{ color: '#1E7B82' }}
                    >
                      {formatCurrency(totals.revenue)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </CardContent>
        </Card>
      )}
    </Section>
  )
}
