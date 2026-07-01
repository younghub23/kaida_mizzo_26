import { Share2, Mail, Sparkles, Megaphone, BarChart3, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { microLabel, card, cardLink, brandGradient } from '@/app/(dashboard)/profile/ui'
import { cn } from '@/lib/utils'

// Key features as category-tinted rows, mirroring the warm tile treatment from
// the dashboard quick-views. Each row carries its soft category tint plus the
// brighter category color used to stroke the icon in its white tile.
const FEATURES = [
  { label: 'Social scheduling', icon: Share2, bg: '#F9E4EE', icon_color: '#D6498C' },
  { label: 'Email & SMS', icon: Mail, bg: '#FBF0D2', icon_color: '#D99A2E' },
  { label: 'AI tools', icon: Sparkles, bg: '#DCF1F2', icon_color: '#36B7C0' },
  { label: 'Paid ads', icon: Megaphone, bg: '#E4F0F8', icon_color: '#5B9BD0' },
  { label: 'Analytics', icon: BarChart3, bg: '#FBEAD9', icon_color: '#E08A3C' },
]

// Shared warm card surface (drop shadcn's ring in favor of the hairline border).
const surface = cn(card, 'ring-0')

export default function AboutPage() {
  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8 max-[820px]:px-[22px]">
        {/* ── Hero ── */}
        <header>
          <span className={cn(microLabel, 'mb-3.5 block')}>About Us</span>
          <h1 className="font-fredoka text-[46px] font-semibold leading-[1.02] tracking-[-0.02em] max-[820px]:text-4xl">
            About{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
            >
              Tala
            </span>
          </h1>
          <p className="mt-3 font-dm-serif text-[21px] italic text-muted-foreground">
            Professional marketing, made simple for small businesses.
          </p>
        </header>

        {/* ── What is Tala? + Our Mission ── */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className={cn(surface, cardLink, 'gap-0 px-8 py-[30px]')}>
            <span className={cn(microLabel, 'mb-[13px] block')}>Overview</span>
            <h2 className="mb-3.5 font-fredoka text-2xl font-semibold">What is Tala?</h2>
            <p className="max-w-[560px] text-[15.5px] leading-[1.7] text-muted-foreground">
              Tala is an AI-powered marketing platform built for small businesses,
              helping you manage your social presence, email and SMS campaigns,
              paid advertising, and performance analytics all in one place.
            </p>
          </Card>

          <Card className={cn(surface, cardLink, 'gap-0 px-8 py-[30px]')}>
            <span className={cn(microLabel, 'mb-[13px] block')}>Mission</span>
            <h2 className="mb-3.5 font-fredoka text-2xl font-semibold">Our Mission</h2>
            <p className="max-w-[560px] text-[15.5px] leading-[1.7] text-muted-foreground">
              We believe small businesses deserve the same marketing power as large
              enterprises. Our mission is to make professional marketing simple,
              affordable, and accessible to everyone, powered by AI.
            </p>
          </Card>
        </div>

        {/* ── Key Features ── */}
        <Card className={cn(surface, cardLink, 'gap-0 px-8 pb-8 pt-[30px]')}>
          <span className={cn(microLabel, 'mb-[13px] block')}>Capabilities</span>
          <h2 className="mb-[22px] font-fredoka text-2xl font-semibold">Key Features</h2>
          <ul className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
            {FEATURES.map(({ label, icon: Icon, bg, icon_color }) => (
              <li
                key={label}
                className="flex items-center gap-4 rounded-[15px] border border-[rgba(58,46,34,.05)] px-5 py-[18px] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(58,46,34,.1)]"
                style={{ background: bg }}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-[13px] bg-white shadow-[0_1px_4px_rgba(58,46,34,.08)]">
                  <Icon className="size-[23px]" strokeWidth={1.8} style={{ color: icon_color }} aria-hidden="true" />
                </span>
                <span className="font-fredoka text-base font-semibold text-foreground">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* ── Contact & Support ── */}
        <Card className={cn(surface, cardLink, 'gap-0 px-8 pb-8 pt-[30px]')}>
          <span className={cn(microLabel, 'mb-[13px] block')}>Get in touch</span>
          <h2 className="mb-3 font-fredoka text-2xl font-semibold">Contact &amp; Support</h2>
          <p className="mb-[22px] text-[15.5px] leading-[1.6] text-muted-foreground">
            Have questions or need help? Reach out to us at{' '}
            <a
              href="mailto:ycaproject.marketing@gmail.com"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              ycaproject.marketing@gmail.com
            </a>
          </p>
          <a
            href="mailto:ycaproject.marketing@gmail.com"
            className="inline-flex w-fit items-center gap-2 rounded-[11px] px-5 py-[11px] text-[14.5px] font-medium text-white shadow-[0_2px_10px_rgba(200,71,46,.22)] transition-[filter,box-shadow,transform] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(200,71,46,.3)] hover:brightness-[1.05]"
            style={{ background: brandGradient }}
          >
            Email support
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </Card>
      </div>
    </div>
  )
}
