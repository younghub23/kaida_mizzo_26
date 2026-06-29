import { Share2, Mail, Sparkles, Megaphone, BarChart3, ArrowUpRight } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const microLabel = 'text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary'

// Warm card surface from the design reference: 14px radius, hairline border, an
// inset top highlight (the shadcn ring is dropped via ring-0).
const card =
  'rounded-[14px] border border-border bg-card ring-0 shadow-[0_1px_0_rgba(255,255,255,.6)_inset]'

// Key features as category-tinted tiles, modeled on the dashboard quick-views.
// Rotates through the warm accent palette (social, email, content, work, tangerine).
const FEATURES = [
  { label: 'Social scheduling', icon: Share2, bg: '#F9E4EE', border: 'rgba(214,73,140,.35)', text: '#A82C66' },
  { label: 'Email & SMS', icon: Mail, bg: '#FBF0D2', border: 'rgba(244,201,109,.5)', text: '#9A6E16' },
  { label: 'AI tools', icon: Sparkles, bg: '#DCF1F2', border: 'rgba(54,183,192,.4)', text: '#1E7B82' },
  { label: 'Paid ads', icon: Megaphone, bg: '#E4F0F8', border: 'rgba(154,198,224,.55)', text: '#3A6E92' },
  { label: 'Analytics', icon: BarChart3, bg: '#F9E8D6', border: 'rgba(224,138,60,.35)', text: '#E08A3C' },
]

export default function AboutPage() {
  return (
    <div className="tala-theme min-h-[calc(100vh-3.5rem)] bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-8 pb-14 pt-8">
        {/* ── Hero ── */}
        <header>
          <span className={microLabel}>About Us</span>
          <h1 className="mt-2 font-fredoka text-[44px] font-semibold leading-[1.04] tracking-[-0.01em]">
            About{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(120deg,#D6488C,#E08A3C)' }}
            >
              Tala
            </span>
          </h1>
          <p className="mt-1.5 font-dm-serif text-xl italic text-muted-foreground">
            Professional marketing, made simple for small businesses.
          </p>
        </header>

        {/* ── What is Tala? + Our Mission ── */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className={card}>
            <CardHeader>
              <span className={microLabel}>Overview</span>
              <CardTitle className="font-fredoka text-xl font-semibold">
                What is Tala?
              </CardTitle>
              <CardDescription className="text-[15px] leading-relaxed text-muted-foreground">
                Tala is an AI-powered marketing platform built for small businesses,
                helping you manage your social presence, email and SMS campaigns,
                paid advertising, and performance analytics all in one place.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className={card}>
            <CardHeader>
              <span className={microLabel}>Mission</span>
              <CardTitle className="font-fredoka text-xl font-semibold">
                Our Mission
              </CardTitle>
              <CardDescription className="text-[15px] leading-relaxed text-muted-foreground">
                We believe small businesses deserve the same marketing power as large
                enterprises. Our mission is to make professional marketing simple,
                affordable, and accessible to everyone, powered by AI.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* ── Key Features ── */}
        <Card className={card}>
          <CardHeader>
            <span className={microLabel}>Capabilities</span>
            <CardTitle className="font-fredoka text-xl font-semibold">
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ label, icon: Icon, bg, border, text }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-[14px] border p-4"
                  style={{ background: bg, borderColor: border }}
                >
                  <span
                    className="flex size-[42px] shrink-0 items-center justify-center rounded-[11px] bg-white"
                    style={{ color: text }}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="font-fredoka text-base font-semibold" style={{ color: '#3A2E22' }}>
                    {label}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* ── Contact & Support ── */}
        <Card className={card}>
          <CardHeader>
            <span className={microLabel}>Get in touch</span>
            <CardTitle className="font-fredoka text-xl font-semibold">
              Contact &amp; Support
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed text-muted-foreground">
              Have questions or need help? Reach out to us at{' '}
              <a
                href="mailto:support@tala.com"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                support@tala.com
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="mailto:support@tala.com"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white',
                'transition-[filter] hover:brightness-105'
              )}
              style={{ background: 'linear-gradient(120deg,#D6488C,#C8472E,#E08A3C)' }}
            >
              Email support
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
