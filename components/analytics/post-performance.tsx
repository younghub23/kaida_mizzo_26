'use client'

import { useState } from 'react'
import { ArrowUpDown, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Section, EmptyState } from '@/components/analytics/data-source'
import { type PostRow } from '@/app/(dashboard)/analytics/mock-data'
import { formatCompact, formatPercent, sourceSuffix, type SectionSource } from '@/lib/analytics/format'
import { NETWORK_LABEL } from '@/components/analytics/network-meta'

type SortKey = 'views' | 'likes' | 'comments' | 'shares' | 'engagementRate'

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'views', label: 'Views' },
  { key: 'likes', label: 'Likes' },
  { key: 'comments', label: 'Comments' },
  { key: 'shares', label: 'Shares' },
  { key: 'engagementRate', label: 'Eng. rate' },
]

export function PostPerformance({ posts: input, source }: { posts: PostRow[]; source: SectionSource }) {
  const [sortKey, setSortKey] = useState<SortKey>('engagementRate')
  const [desc, setDesc] = useState(true)

  const posts = [...input].sort((a, b) => {
    const diff = (a[sortKey] as number) - (b[sortKey] as number)
    return desc ? -diff : diff
  })

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDesc((d) => !d)
    } else {
      setSortKey(key)
      setDesc(true)
    }
  }

  return (
    <Section
      title="Content performance"
      icon={FileText}
      source={`scheduled_posts + per-network insights ${sourceSuffix(source)}`}
      description="Per-post metrics across formats and captions. The post list is already in Supabase — engagement numbers join in from each network's API."
    >
      {source === 'empty' ? (
        <EmptyState message="Connect an account to see how individual posts performed." />
      ) : (
      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Post</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Format</TableHead>
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {col.label}
                      <ArrowUpDown
                        className={sortKey === col.key ? 'size-3 text-foreground' : 'size-3 opacity-40'}
                      />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <PostRowCells key={post.id} post={post} />
              ))}
              {posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                    No posts for this network yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
    </Section>
  )
}

function PostRowCells({ post }: { post: PostRow }) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className="line-clamp-1">{post.caption}</span>
        <span className="text-xs text-muted-foreground">{post.postedAt}</span>
      </TableCell>
      <TableCell>{NETWORK_LABEL[post.platform]}</TableCell>
      <TableCell>
        <Badge variant="secondary">{post.format}</Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCompact(post.views)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCompact(post.likes)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCompact(post.comments)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCompact(post.shares)}</TableCell>
      <TableCell
        className="text-right font-fredoka font-semibold tabular-nums"
        style={{ color: '#1E7B82' }}
      >
        {formatPercent(post.engagementRate)}
      </TableCell>
    </TableRow>
  )
}
