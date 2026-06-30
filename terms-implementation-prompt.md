# Prompt for Claude Code — Restyle the Tala Terms of Service page (same wording, one email change)

> No new `terms.html` mockup was provided — apply the **established warm Tala
> design language** (the same system used by the Dashboard/About/Profile re-skins
> and documented in `design-language-reference.md`). The Terms page currently uses
> the older magenta-on-cream style and should be brought in line with it.

---

You are restyling the **Terms of Service** page of **Tala** (this repo) to match
the warm, editorial Tala design system (cream paper, soft-brown ink, Fredoka
headings, DM Serif accents, warm card surfaces). **The legal copy does not change
— keep the exact same wording.** This is a presentation-only re-skin with **one
deliberate content change: the support/contact email.**

## The rules that override everything else

1. **Do not change any functionality.** No changes to routes, metadata, the
   `LegalDoc` data model, or behavior. Presentation only.

2. **SAME WORDING — keep the legal text verbatim.** Preserve the title
   ("Terms of Service"), the "Last updated" date, the disclaimer, the intro, and
   all 15 sections **word for word** (`app/(legal)/terms/page.tsx`). Do not
   rewrite, summarize, reorder, or "improve" any clause. This is real legal copy.

3. **THE ONE CHANGE — the only support/help email shown must be
   `ycaproject.marketing@gmail.com`.** In section **15. Contact**, replace
   `support@tala.com` with `ycaproject.marketing@gmail.com`. Render it as a
   `mailto:ycaproject.marketing@gmail.com` link. **Verify this is the ONLY email
   address anywhere on the rendered Terms page** — no other support/contact email
   may appear.

Before writing any Next.js code, read `node_modules/next/dist/docs/` per
`AGENTS.md` (Next 16 has breaking changes). Read `design-language-reference.md`
for the shared tokens.

## What already exists (reuse it — do not reinvent)

- **Page (content + the email):** `app/(legal)/terms/page.tsx` — defines
  `DISCLAIMER`, `INTRO`, and the `SECTIONS` array passed to `<LegalDoc>`. The
  email lives in the last section's body string ("Questions about these Terms?
  Contact us at support@tala.com."). **Change only that email string; leave every
  other word as-is.**
- **Renderer:** `components/legal/legal-doc.tsx` (`LegalDoc`) — renders the title,
  last-updated, disclaimer box, intro, and sections (paragraphs + bullet lists).
  This is where most of the visual restyle happens.
- **Layout:** `app/(legal)/layout.tsx` — the `tala` wordmark header, "Sign in"
  link, and Terms/Privacy/Sign-in footer, currently on the magenta `#C13A77` /
  `#FBF0CE` palette. Restyle to the warm system.
- **Tokens:** `.tala-theme` + `font-fredoka`/`font-dm-serif` + gradients in
  `app/globals.css`; reuse the `card`/`microLabel` recipes (e.g. from
  `app/(dashboard)/profile/ui.ts`).

## Your task: bring Terms into the warm design system

Restyle `LegalDoc` and the `(legal)` layout to the editorial Tala look:
- Page on cream (`--page`), text in ink (`--foreground`, never pure black),
  centered readable column (keep the existing `max-w-3xl` measure or similar).
- **Title** in Fredoka (semibold), warm-toned; "Last updated" line muted. The
  intro disclaimer becomes a warm callout (e.g. a soft category-tinted card with a
  hairline border + inset highlight) rather than the magenta box.
- **Section headings** in Fredoka; body copy in the app body font, comfortable
  line length and `leading-relaxed`; bullet lists keep their structure.
- **Links** (including the contact mailto) use the accent/brand color with a
  subtle underline; hover to the hover-accent.
- **Layout header/footer:** the `tala` wordmark and the Terms/Privacy/Sign-in
  links restyled to the warm palette (logo tile or wordmark per the rest of the
  app), keeping the same links and routes.
- Swap any inline UI SVGs for `lucide-react`; no raw mockup CSS vars.

### Note on the shared `LegalDoc` (Privacy uses it too)

`LegalDoc` and `(legal)/layout.tsx` are **also used by the Privacy page**
(`app/(legal)/privacy/page.tsx`). Restyling the shared component/layout will warm
up Privacy too — that's fine and desirable for consistency. **But the email change
is Terms-only:** do **not** edit Privacy's wording or its `privacy@tala.com`
addresses. (The About page's `support@tala.com` is also out of scope here.) Only
the Terms page's contact email becomes `ycaproject.marketing@gmail.com`.

## Acceptance checklist

- [ ] `npm run lint` and `npm run build` pass.
- [ ] Every word of the Terms copy is unchanged except the contact email.
- [ ] Section 15 reads "…contact us at `ycaproject.marketing@gmail.com`." as a
      `mailto:` link, and it is the **only** email anywhere on the Terms page.
- [ ] No routes/metadata/data-model/behavior changes (presentation + the one email
      string only).
- [ ] Terms (and the shared legal layout/`LegalDoc`) now read in the warm Tala
      system — Fredoka headings, DM Serif accents, cream/ink, warm cards — no
      leftover magenta `#C13A77`/`#FBF0CE`.
- [ ] Privacy's wording and its `privacy@tala.com` emails are untouched.
- [ ] Tokens/icons reuse `.tala-theme` + `lucide-react`.
