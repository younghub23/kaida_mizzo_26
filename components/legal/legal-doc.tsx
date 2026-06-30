import { ReactNode } from 'react'

type Block = string | { list: string[] }

export type LegalSection = {
  heading: string
  body: Block[]
}

function renderBlock(block: Block, key: number): ReactNode {
  if (typeof block === 'string') {
    return (
      <p key={key} className="mt-3 text-[15px] leading-relaxed">
        {block}
      </p>
    )
  }
  return (
    <ul
      key={key}
      className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed"
    >
      {block.list.map((item, i) => (
        <li key={i}>{item}</li>
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
  disclaimer?: string
  intro: string[]
  sections: LegalSection[]
}) {
  return (
    <article className="text-[#4A2E3C]">
      <h1 className="font-[family-name:var(--font-fredoka)] text-4xl font-bold text-[#C13A77]">
        {title}
      </h1>
      <p className="mt-2 text-sm text-[#C13A77]/70">Last updated: {lastUpdated}</p>

      {disclaimer && (
        <div className="mt-6 rounded-sm border border-[#C13A77]/40 bg-[#C13A77]/5 p-4 text-sm">
          {disclaimer}
        </div>
      )}

      {intro.map((p, i) => (
        <p key={i} className="mt-4 text-[15px] leading-relaxed">
          {p}
        </p>
      ))}

      {sections.map((section, i) => (
        <section key={i}>
          <h2 className="mt-10 font-[family-name:var(--font-fredoka)] text-xl font-semibold text-[#C13A77]">
            {section.heading}
          </h2>
          {section.body.map((block, j) => renderBlock(block, j))}
        </section>
      ))}
    </article>
  )
}
