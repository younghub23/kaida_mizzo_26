import { Trophy, Heart, MessageCircle, Share2, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { type PostRow } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatPercent, sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { NETWORK_LABEL } from '@/components/analytics/network-meta'

export function TopContent({ posts, source }: { posts: PostRow[]; source: SectionSource }) {
  const top = [...posts].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 3)

  return (
    <Section
      title="Top content"
      icon={Trophy}
      iconColor="#E08A3C"
      eyebrow="Highlights"
      source={`scheduled_posts + per-network insights ${sourceSuffix(source)}`}
      description="Your highest-engagement posts — surfacing which formats, captions, and times performed best."
    >
      {source === 'empty' ? (
        <EmptyState message="Connect an account to surface your best-performing posts." />
      ) : top.length === 0 ? (
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
                  <Badge
                    variant={i === 0 ? 'default' : 'secondary'}
                    className={i === 0 ? 'font-fredoka text-white' : 'font-fredoka'}
                  >
                    #{i + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{NETWORK_LABEL[post.platform]}</span>
                </div>
                <CardTitle className="line-clamp-2 text-sm">{post.caption}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{post.format}</span>
                  <span className="font-fredoka font-semibold" style={{ color: '#1E7B82' }}>
                    {formatPercent(post.engagementRate)} eng.
                  </span>
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
