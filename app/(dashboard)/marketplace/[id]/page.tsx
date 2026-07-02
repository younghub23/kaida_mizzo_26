import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, MessageSquare, UserRound, Globe, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMarketplaceProfile, type MarketplaceDetail } from '@/lib/marketplace'
import { startConversation } from '@/app/actions/messages'
import { CREATOR_CHANNELS, parseCreatorProfile } from '@/lib/creator'
import { parseBrandProfile } from '@/lib/brand'
import { getAccountType } from '@/lib/account'
import {
  brandSignals,
  creatorSignals,
  hasSignals,
  scoreMatch,
  type MatchResult,
  type MatchSignals,
} from '@/lib/match'
import { MatchRing } from '@/components/marketplace/match-ring'
import { microLabel, card, chipPalettes } from '@/app/(dashboard)/profile/ui'

function targetSignals(profile: MarketplaceDetail): MatchSignals {
  if (profile.accountType === 'creator' && profile.creator) {
    return creatorSignals(profile.creator)
  }
  if (profile.brand) return brandSignals(profile.brand, profile.industry)
  return { values: [], topics: [], audiences: [] }
}

export default async function MarketplaceProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getMarketplaceProfile(id)
  if (!profile) notFound()

  const isSelf = profile.id === user.id

  // Compatibility between the viewer and this profile (real overlap only).
  const viewerType = getAccountType(user)
  const { data: me } = await supabase
    .from('profiles')
    .select('industry, brand_profile, creator_profile')
    .eq('id', user.id)
    .single()
  const viewerSignals =
    viewerType === 'creator'
      ? creatorSignals(parseCreatorProfile(me?.creator_profile))
      : brandSignals(parseBrandProfile(me?.brand_profile), (me?.industry ?? '').trim())
  const target = targetSignals(profile)
  const match =
    !isSelf && hasSignals(viewerSignals) && hasSignals(target)
      ? scoreMatch(viewerSignals, target)
      : null
  const showMatch = match !== null && match.score > 0

  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[860px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#8A715C]"
        >
          <ArrowLeft className="size-4" />
          Back to marketplace
        </Link>

        {/* Identity header */}
        <div className={`${card} flex flex-col gap-5 p-6 sm:flex-row sm:items-center`}>
          <span className="size-20 shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-foreground/10">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center">
                <UserRound className="size-9 text-muted-foreground" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <span className={microLabel}>
              {profile.accountType === 'creator' ? 'Creator' : 'Brand'}
            </span>
            <h1 className="mt-1 font-fredoka text-[30px] font-semibold leading-tight tracking-[-0.01em]">
              {profile.name}
            </h1>
            {profile.headline && (
              <p className="mt-0.5 text-sm font-medium text-primary">{profile.headline}</p>
            )}
          </div>
          {showMatch && (
            <div className="flex flex-col items-center gap-1">
              <MatchRing score={match.score} size={60} strokeWidth={5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Match
              </span>
            </div>
          )}
          {!isSelf && (
            <form action={startConversation.bind(null, profile.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-[11px] px-5 py-3 font-fredoka text-[14px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,transform] hover:-translate-y-px hover:brightness-105"
                style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
              >
                <MessageSquare className="size-4" />
                Message
              </button>
            </form>
          )}
        </div>

        {showMatch && <WhyYouMatch match={match} name={profile.name} />}

        {profile.accountType === 'creator' ? (
          <CreatorDetail profile={profile} />
        ) : (
          <BrandDetail profile={profile} />
        )}
      </div>
    </div>
  )
}

function WhyYouMatch({ match, name }: { match: MatchResult; name: string }) {
  const groups = [
    { label: 'Shared values', items: match.sharedValues },
    { label: 'Audience', items: match.sharedAudiences },
    { label: 'Content', items: match.sharedTopics },
  ].filter((g) => g.items.length > 0)

  if (groups.length === 0) return null

  return (
    <div
      className="flex flex-col gap-4 rounded-[14px] border p-6"
      style={{
        borderColor: 'rgba(214,72,140,.22)',
        background: 'linear-gradient(165deg,rgba(214,72,140,.07),rgba(224,138,60,.05))',
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[#D6488C]" />
        <span className={microLabel}>Why you match</span>
      </div>
      <p className="text-[14px] text-muted-foreground">
        You and {name} have {match.score}% compatibility based on your profiles.
      </p>
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g.label} className="flex flex-wrap items-center gap-2">
            <span className="w-24 shrink-0 text-[12.5px] font-semibold text-foreground">
              {g.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {g.items.map((item, i) => {
                const palette = chipPalettes[i % chipPalettes.length]
                return (
                  <span
                    key={item}
                    className="rounded-full border px-3 py-1 text-[13px] font-medium"
                    style={{
                      background: palette.bg,
                      borderColor: palette.border,
                      color: palette.text,
                    }}
                  >
                    {item}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${card} flex flex-col gap-3 p-6`}>
      <span className={microLabel}>{title}</span>
      {children}
    </div>
  )
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t, i) => {
        const palette = chipPalettes[i % chipPalettes.length]
        return (
          <span
            key={t}
            className="rounded-full border px-3 py-1 text-[13px] font-medium"
            style={{ background: palette.bg, borderColor: palette.border, color: palette.text }}
          >
            {t}
          </span>
        )
      })}
    </div>
  )
}

function CreatorDetail({ profile }: { profile: MarketplaceDetail }) {
  const c = profile.creator
  if (!c) return null
  const channels = CREATOR_CHANNELS.map((ch) => ({
    label: ch.label,
    value: c[ch.key].trim(),
  })).filter((ch) => ch.value)

  return (
    <>
      {c.bio && (
        <Section title="About">
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
            {c.bio}
          </p>
        </Section>
      )}

      {channels.length > 0 && (
        <Section title="Channels">
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <span
                key={ch.label}
                className="rounded-[10px] border border-border bg-background px-3 py-1.5 text-[13px]"
              >
                <span className="font-fredoka font-semibold">{ch.label}</span>{' '}
                <span className="text-muted-foreground">
                  {ch.value.startsWith('@') ? ch.value : `@${ch.value}`}
                </span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {c.primaryDemographic && (
        <Section title="Primary demographic">
          <p className="text-[15px] text-muted-foreground">{c.primaryDemographic}</p>
        </Section>
      )}

      {c.contentCategories.length > 0 && (
        <Section title="Content">
          <TagRow tags={c.contentCategories} />
        </Section>
      )}

      {c.values.length > 0 && (
        <Section title="Values">
          <TagRow tags={c.values} />
        </Section>
      )}
    </>
  )
}

function BrandDetail({ profile }: { profile: MarketplaceDetail }) {
  const b = profile.brand
  if (!b) return null
  const website = b.website.trim()
  const audience = [
    b.targetAgeRanges.length ? `Ages ${b.targetAgeRanges.join(', ')}` : '',
    b.targetGenders.join(', '),
    b.targetLocations,
    b.targetInterests,
  ].filter(Boolean)

  return (
    <>
      {(b.tagline || b.description) && (
        <Section title="About">
          {b.tagline && <p className="font-fredoka text-lg font-semibold">{b.tagline}</p>}
          {b.description && (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {b.description}
            </p>
          )}
        </Section>
      )}

      {(profile.industry || website) && (
        <Section title="Details">
          <div className="flex flex-col gap-1.5 text-[14px]">
            {profile.industry && (
              <p>
                <span className="text-muted-foreground">Industry: </span>
                {profile.industry}
              </p>
            )}
            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <Globe className="size-4" />
                {website}
              </a>
            )}
          </div>
        </Section>
      )}

      {audience.length > 0 && (
        <Section title="Audience">
          <div className="flex flex-col gap-1 text-[14px] text-muted-foreground">
            {audience.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Section>
      )}

      {b.contentTopics.length > 0 && (
        <Section title="Content topics">
          <TagRow tags={b.contentTopics} />
        </Section>
      )}

      {b.brandValues.length > 0 && (
        <Section title="Values">
          <TagRow tags={b.brandValues} />
        </Section>
      )}
    </>
  )
}
