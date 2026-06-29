import { Swords } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { BarRow } from '@/components/analytics/charts'
import { type Competitor } from '@/app/(dashboard)/analytics/mock-data'
import { formatPercent, sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'

export function CompetitorBenchmark({
  rows,
  source,
}: {
  // Brand-level — needs a competitive-intelligence integration. Live when one is
  // configured, mock in dev, empty otherwise.
  rows: Competitor[]
  source: SectionSource
}) {
  const maxSov = rows.length ? Math.max(...rows.map((c) => c.shareOfVoicePct)) : 0

  return (
    <Section
      title="Competitor benchmark"
      icon={Swords}
      source={`Competitive intel provider ${sourceSuffix(source)}`}
      description="How your engagement and follower growth stack up against rivals, plus share of voice."
    >
      {source === 'empty' || rows.length === 0 ? (
        <EmptyState message="Competitor benchmarking requires a competitive-intelligence integration (not connected yet)." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-fredoka font-semibold">Engagement &amp; follower growth</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead className="text-right">Eng. rate</TableHead>
                    <TableHead className="text-right">Follower growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.name} className={cn(c.isYou && 'bg-muted/40')}>
                      <TableCell className="font-medium">
                        {c.name}
                        {c.isYou && (
                          <Badge variant="default" className="ml-2">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(c.engagementRate)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatPercent(c.followerGrowthPct)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-fredoka font-semibold">Share of voice</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {rows.map((c) => (
                <BarRow
                  key={c.name}
                  label={c.name}
                  value={c.shareOfVoicePct}
                  max={maxSov}
                  // You = bougainvillea so your bar pops; rivals stay soft sky-blue.
                  color={c.isYou ? '#D6498C' : '#9AC6E0'}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </Section>
  )
}
