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
import { Section } from '@/components/analytics/data-source'
import { BarRow } from '@/components/analytics/charts'
import { getCompetitors, type Network } from '@/app/(dashboard)/analytics/mock-data'
import { formatPercent } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'

export function CompetitorBenchmark({ network }: { network: Network }) {
  const competitors = getCompetitors(network)
  const maxSov = Math.max(...competitors.map((c) => c.shareOfVoicePct))

  return (
    <Section
      title="Competitor benchmark"
      icon={Swords}
      source="Competitive intel provider (mock)"
      description="How your engagement and follower growth stack up against rivals, plus share of voice."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Engagement &amp; follower growth</CardTitle>
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
                {competitors.map((c) => (
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
            <CardTitle>Share of voice</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {competitors.map((c) => (
              <BarRow
                key={c.name}
                label={c.name}
                value={c.shareOfVoicePct}
                max={maxSov}
                color={c.isYou ? 'var(--chart-5)' : 'var(--chart-1)'}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
