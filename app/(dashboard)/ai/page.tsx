import { createClient } from '@/lib/supabase/server'
import { canUseContentStrategist, canUseDataAnalyst } from '@/lib/analytics/plan'
import { listConversations } from '@/app/actions/ai-chat'
import { AiChat } from '@/components/ai/chat/ai-chat'

export default async function AiPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let plan = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    plan = profile?.plan ?? 'free'
  }

  const conversations = await listConversations()

  return (
    <AiChat
      initialConversations={conversations}
      canStrategist={canUseContentStrategist(plan)}
      canAnalyst={canUseDataAnalyst(plan)}
    />
  )
}
