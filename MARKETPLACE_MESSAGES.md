# Content Marketplace & Messages — spec + implementation

The marketplace connects Tala **brands** and **creators** for partnerships —
brands find creators to market their products, creators find brands for deals
(think matchmaking for brand deals). **Messages** is the 1:1 DM inbox where those
brand↔creator conversations happen and are stored.

This document describes what shipped (v1) and what's intentionally deferred.

---

## 1. Data model

All schema lives in `db/migrations/0003_marketplace_messages.sql` (applied to the
`YCA Project` Supabase project). It is idempotent.

### profiles (extended)

| column | type | purpose |
| --- | --- | --- |
| `account_type` | `text` | Denormalized copy of `auth.users.user_metadata.account_type` so the directory can filter/list by it in SQL. Backfilled from auth metadata; kept in sync by `app/(dashboard)/layout.tsx` on dashboard load. |
| `marketplace_visible` | `boolean` (default `true`) | Discoverability flag. A profile appears in the directory only when `true`. |

Also **widened the `profiles_plan_check`** constraint to allow `creator` and
`past_due` (previously only the four business tiers were permitted — writing
`'creator'` or `'past_due'` failed, which silently broke creator checkout and the
payment-failed webhook path).

### conversations

One row per 1:1 thread. Participants are stored in canonical order
(`user_low < user_high`) with a `UNIQUE (user_low, user_high)` constraint so a
pair can never get duplicate threads. Carries `last_message_at` +
`last_message_preview` for a cheap inbox render.

RLS: a participant can `SELECT` / `INSERT` / `UPDATE` their own conversations.

### messages

`conversation_id`, `sender_id`, `body`, `created_at`, `read_at`. Indexed on
`(conversation_id, created_at)`.

RLS: only the two participants of the parent conversation can read; only the
sender (and only if a participant) can insert; participants can update (used to
set `read_at`). Added to the `supabase_realtime` publication so the live chat
receives inserts.

### Privacy note

`profiles` `SELECT` RLS is **own-row-only**. Cross-user reads for the directory
and for resolving the "other participant" in a thread are done with the
**service-role admin client**, selecting only public columns
(`id, full_name, avatar_url, industry, account_type, brand_profile,
creator_profile`) — never `email`, `plan`, or `stripe_customer_id`.

---

## 2. Server data layer

### `lib/marketplace.ts`
- `listMarketplaceProfiles({ viewerId, viewerType, q?, tag?, sort?, viewerSignals? })`
  — lists the **opposite** side (businesses see creators, creators see brands),
  visible only, excluding self. Optional name search (`ilike`), single tag filter,
  and sort (`match` | `new` | `name`). When `viewerSignals` are supplied, each card
  carries a `match` result and results default to best-match order.
- `getMarketplaceProfile(id)` — full `MarketplaceDetail` for the profile page;
  returns `null` if hidden.

### `lib/match.ts` — compatibility engine
Scores a brand↔creator pair 0–100 from real profile overlap across three
weighted dimensions: **values** (40), **content/topics** (35, fuzzy so "Beauty"
matches "beauty tips"), and **audience generations** (25, mapping age ranges +
demographic labels into Gen Z / Millennial / Gen X / Boomer buckets). Returns the
concrete shared items so the UI can explain *why* two profiles match. A dimension
only counts when both sides supplied data; empty/no-overlap → 0 (never fabricated).

Surfaced as: match rings on directory cards + a "why you match" breakdown and a
larger ring on the detail page. Match scoring is gated on the viewer having a
usable profile (otherwise the UI nudges them to complete it).

### `lib/messages.ts`
- `getOrCreateConversation(meId, otherId)` — canonical-ordered upsert, race-safe.
- `listConversations(meId)` — inbox rows, newest first, with per-thread unread
  counts (one query over unread messages addressed to me).
- `getConversationThread(meId, conversationId)` — messages + other participant;
  `null` if the viewer isn't a member (enforced by RLS).
- `markConversationRead(meId, conversationId)` — marks the other side's messages
  read.

### `app/actions/messages.ts`
- `startConversation(otherId)` — server action: validates the target is a real,
  visible profile, get-or-creates the conversation, redirects to the thread.
  Bound with the target id from the marketplace detail "Message" button.

---

## 3. UI

| Route | What it is |
| --- | --- |
| `/marketplace` | **Netflix-style browse**: a "Recommended for you" rail (best matches) on top, then horizontally-scrolling rails grouped by genre (content), audience (generation), and values — built by `buildMarketplaceRails`. Typing a search / picking a tag switches to a filterable **grid** with the sort control. Honest empty states. |
| `/marketplace/[id]` | Public profile detail. Creator view: bio, channels, demographic, content, values. Brand view: tagline/description, industry, website, audience, topics, values. "Message" CTA (hidden on your own profile). |
| `/messages` | Inbox: conversation rows with avatar, name, headline, last-message preview, relative time, unread badge. Empty state links to the marketplace. |
| `/messages/[id]` | Live thread. `thread-view.tsx` (client) sends/receives via the browser Supabase client and subscribes to `postgres_changes` (INSERT **and** UPDATE) on `messages`; day separators, live **Seen / Sent** read receipts, **typing indicators** (realtime broadcast), and **image attachments** (uploaded via `/api/upload-post-image` → `messages.attachment_url`). |

Both account types can reach `/marketplace` and `/messages` (middleware gates only
the business-only marketing tools away from creators). Both dashboards end with a
**"Recommended for you"** rail (`components/marketplace/recommended-rail.tsx`).
The creator dashboard's "Notifications & activity" card shows up to 3 real recent
conversations, and the sidebar **Messages** item carries a live unread badge (a
dot on the collapsed rail). The marketplace header has a **Discoverable / Hidden**
toggle (`marketplace_visible`, via `app/actions/marketplace.ts`).

**Attachments require** a public `post-images` storage bucket (already used by the
post composer). Image attachment URLs are public/unguessable, not access-controlled
— acceptable for v1, same model as post images.

Design follows `design-language-reference.md` (tala-theme tokens, Fredoka /
DM-Serif, `ui.ts` recipes, lucide icons).

---

## 4. Deferred (not yet)

- **Rich messaging.** Attachments (images), typing indicators, and read receipts
  ship; still no message edit/delete, multi-file/non-image attachments, or
  email/push notifications.
- **Match tuning.** Weights are fixed; there's no per-user "looking for" intent or
  learning from who you message. Topic overlap is string-based (no embeddings).
- **Blocking / reporting / rate-limiting** for safety.
- **Pagination.** Rails + grid cap at 200 profiles; add keyset pagination as the
  user base grows.
- **Live unread badge refresh.** The sidebar badge is computed per navigation
  (server), not pushed in real time.
- **Attachment access control.** Files live in the public `post-images` bucket
  (URL-addressable). Move to a private bucket with signed URLs for true privacy.
