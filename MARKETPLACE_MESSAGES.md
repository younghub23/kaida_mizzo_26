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
- `listMarketplaceProfiles({ viewerId, viewerType, q?, tag? })` — lists the
  **opposite** side (businesses see creators, creators see brands), visible only,
  excluding self. Optional name search (`ilike`) and single tag filter. Maps each
  row to a compact `MarketplaceProfile` card (name, avatar, headline, summary,
  tags) derived from the brand/creator profile.
- `getMarketplaceProfile(id)` — full `MarketplaceDetail` for the profile page;
  returns `null` if hidden.

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
| `/marketplace` | Directory of the opposite side. Search box + tag chips (derived from real result tags). Cards link to the detail page. Honest empty states. |
| `/marketplace/[id]` | Public profile detail. Creator view: bio, channels, demographic, content, values. Brand view: tagline/description, industry, website, audience, topics, values. "Message" CTA (hidden on your own profile). |
| `/messages` | Inbox: conversation rows with avatar, name, headline, last-message preview, relative time, unread badge. Empty state links to the marketplace. |
| `/messages/[id]` | Live thread. `thread-view.tsx` (client) sends/receives via the browser Supabase client and subscribes to `postgres_changes` on `messages` for real-time delivery; marks incoming read; keeps the conversation preview current. |

Both account types can reach `/marketplace` and `/messages` (middleware gates only
the business-only marketing tools away from creators). The creator dashboard's
"Notifications & activity" card now shows up to 3 real recent conversations.

Design follows `design-language-reference.md` (tala-theme tokens, Fredoka /
DM-Serif, `ui.ts` recipes, lucide icons).

---

## 4. Deferred (not in v1)

- **Smart matching / ranking.** v1 lists the opposite side with name search + a
  tag filter. Audience/sector/value-based match scoring (using the fields already
  captured in `brand_profile` / `creator_profile`) is the natural next step.
- **Visibility controls UI.** `marketplace_visible` defaults to `true`; there's
  no opt-out toggle in Settings yet (column + query support exist).
- **Rich messaging.** No attachments, typing indicators, message deletion/edits,
  or push/email notifications yet. Unread is tracked; there's no global unread
  badge in the sidebar.
- **Blocking / reporting / rate-limiting** for safety.
- **Pagination.** The directory caps at 200 results; add keyset pagination as the
  user base grows.
