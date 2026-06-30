import { ReactNode } from 'react'
import { Info } from 'lucide-react'

type Block = string | { list: string[] }

export type LegalSection = {
  heading: string
  body: Block[]
}

// Warm editorial link treatment (brand brown, subtle underline, hover to the
// warmer hover-accent). Shared by inline links and any auto-linked email.
const linkClass =
  'font-medium text-primary underline underline-offset-2 transition-colors hover:text-[#8A715C]'

// Split a paragraph on email addresses and render each as a mailto: link, so
// the legal copy stays plain strings (no data-model change) while contact
// emails become clickable.
const EMAIL_SPLIT = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g
const isEmail = (s: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s)

function renderText(text: string): ReactNode {
  return text.split(EMAIL_SPLIT).map((part, i) =>
    isEmail(part) ? (
      <a key={i} href={`mailto:${part}`} className={linkClass}>
        {part}
      </a>
    ) : (
      part
    ),
  )
}

function renderBlock(block: Block, key: number): ReactNode {
  if (typeof block === 'string') {
    return (
      <p key={key} className="mt-3 text-[15px] leading-relaxed text-foreground">
        {renderText(block)}
      </p>
    )
  }
  return (
    <ul
      key={key}
      className="mt-3 flex list-none flex-col gap-2.5 text-[15px] leading-relaxed text-foreground"
    >
      {block.list.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            className="mt-[11px] size-1.5 shrink-0 rounded-full"
            style={{ background: '#A48D78' }}
            aria-hidden="true"
          />
          <span>{renderText(item)}</span>
        </li>
      ))}
    </ul>
  )
}

export function LegalDoc({
  title,
  lastUpdated,
  disclaimer,
  intro,
  sections,
}: {
  title: string
  lastUpdated: string
  disclaimer: string
  intro: string[]
  sections: LegalSection[]
}) {
  return (
    <article className="text-foreground">
      <span className="mb-3 block font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
        Legal
      </span>
      <h1 className="font-fredoka text-[46px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground max-[820px]:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      {/* Disclaimer as a warm, lemon-tinted callout (hairline border + inset
          top highlight) rather than a flat box. */}
      <aside
        className="mt-7 flex gap-3 rounded-[14px] border p-5 shadow-[0_1px_0_rgba(255,255,255,.6)_inset]"
        style={{ background: '#FBF0D2', borderColor: 'rgba(244,201,109,.5)' }}
      >
        <Info
          className="mt-0.5 size-[18px] shrink-0"
          strokeWidth={1.8}
          style={{ color: '#9A6E16' }}
          aria-hidden="true"
        />
        <div>
          <span
            className="mb-1 block font-fredoka text-[10.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: '#9A6E16' }}
          >
            Please note
          </span>
          <p className="text-sm leading-relaxed text-foreground">{disclaimer}</p>
        </div>
      </aside>

      {intro.map((p, i) => (
        <p key={i} className="mt-5 text-[17px] leading-relaxed text-foreground">
          {renderText(p)}
        </p>
      ))}

      {sections.map((section, i) => (
        <section key={i} className="scroll-mt-24">
          <h2 className="mt-10 font-fredoka text-[22px] font-semibold text-foreground">
            {section.heading}
          </h2>
          {section.body.map((block, j) => renderBlock(block, j))}
        </section>
      ))}
    </article>
  )
}
