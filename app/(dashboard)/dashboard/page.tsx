import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const STATS = [
  { label: 'Total Posts', value: '0' },
  { label: 'Connected Channels', value: '0' },
  { label: 'Total Contacts', value: '0' },
  { label: 'Email Open Rate', value: '0%' },
]

const QUICK_ACTIONS = ['Create Post', 'Send Email', 'View Analytics']

const CHANNELS = ['Facebook', 'Instagram', 'LinkedIn', 'TikTok']

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const businessName = profile?.full_name ?? 'there'

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">
        {getGreeting()}, {businessName}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button key={action} variant="outline">
              {action}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connect Your Channels</CardTitle>
          <CardDescription>
            Link your social accounts to start posting and tracking performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {CHANNELS.map((channel) => (
            <div
              key={channel}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{channel}</span>
                <span className="text-sm text-muted-foreground">Not connected</span>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
