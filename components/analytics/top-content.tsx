import { Trophy, Heart, MessageCircle, Share2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Section } from '@/components/analytics/data-source'
import { getTopContent, type Network } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatPercent } from '@/lib/analytics/format'
import { NETWORK_LABEL } from '@/components/analytics/network-meta'

export function TopContent({ network }: { network: Network }) {
  const top = getTopContent(network)

  return (
    <Section
      title="Top content"
      icon={Trophy}
      source="scheduled_posts (mock) + per-network insights"
      description="Your highest-engagement posts — surfacing which formats, captions, and times performed best."
    >
      {top.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No posts for this network yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {top.map((post, i) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant={i === 0 ? 'default' : 'secondary'}>#{i + 1}</Badge>
                  <span className="text-xs text-muted-foreground">{NETWORK_LABEL[post.platform]}</span>
                </div>
                <CardTitle className="line-clamp-2 text-sm">{post.caption}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{post.format}</span>
                  <span className="font-semibold">{formatPercent(post.engagementRate)} eng.</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground">
                  <Metric icon={Eye} value={post.views} />
                  <Metric icon={Heart} value={post.likes} />
                  <Metric icon={MessageCircle} value={post.comments} />
                  <Metric icon={Share2} value={post.shares} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}

function Metric({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-3" />
      {formatCompact(value)}
    </span>
  )
}
