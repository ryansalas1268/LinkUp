## Goal

Produce a single Markdown deliverable in `/mnt/documents/` that the team can read straight off the screen during slide 15 ("Demo") of the Final Presentation, plus a simplified backend section the presenter can use for Q&A. Tailored so it does NOT re-explain things already covered earlier in the deck (the need, DFD, activity diagram, roles, backlogs, burndown).

## Deliverable

**File:** `/mnt/documents/LinkUp_Demo_Script_and_Backend_Notes_v2.md`

(Versioned `_v2` so the previous file stays intact for comparison.)

### Section 1 — Demo Script (5–7 min, ~900–1100 words)

Written as spoken lines with `[action: …]` cues, timed to land in 6 minutes with buffer. Picks up directly after slide 14 (Burndown) → slide 15 (Demo).

| Time | Beat | What presenter says / does |
|------|------|----------------------------|
| 0:00–0:30 | **Cold open** | Land on the LinkUp landing page. One-line callback to "the need" from slide 5 — "remember, plans never leave the group chat. Here's what does." |
| 0:30–1:15 | **Login as Ryan25 / Demo123!** | Show username-or-email login + Google option. Mention real validation (BR001–BR004) without naming the rule numbers. |
| 1:15–2:30 | **Events feed (host vs. guest)** | Walk through the 3 seeded events: Karaoke (hosting), Soccer (going), Maya's Birthday (maybe). Open Karaoke → show RSVPs, tasks with priority, expense splits. |
| 2:30–3:30 | **Create an event + freemium gate** | Try to create a 2nd event → hit the "1 event/month on free" cap → show the upgrade modal. Tie back to the Premium User story from slide 11. |
| 3:30–4:30 | **Friends + real-time messaging** | Open Friends, send a message in an event chat from a second tab/account, watch it appear live. Connects to the "Messaging system (6.0)" box from the DFD. |
| 4:30–5:30 | **Calendar + Wrapped** | Smart calendar view, then the Wrapped page as the "delight" feature reviewers won't expect. |
| 5:30–6:00 | **Close** | One sentence: "Every box on our DFD — accounts, friends, events, tasks, messages, payments — is wired to a live database with row-level security. Back to the slides." |

Each beat includes:
- The exact sentence to say (short, conversational).
- The click path.
- One fallback line if something fails ("If the live message doesn't appear, refresh — it's cached locally too").

### Section 2 — Backend Notes (plain English, for Q&A)

Written for a non-technical audience but accurate enough that a CS professor won't push back. Maps each item back to a DFD process from slide 7 so the presenter can answer "where does X live?" instantly.

Topics:

1. **Where accounts live** — `auth.users` (private, holds the password hash) + `profiles` table (public name, username, avatar). Why we split them: security. Maps to **Process 1.0 Account Management**.
2. **Where event details live** — `events` table (title, time, location, host) + `rsvps` table (one row per guest, status: going/maybe/no/invited) + `tasks` and `expenses`. Maps to **5.0 Events** and **D5 Event Pages**.
3. **Where friends live** — `friendships` table with sender / receiver / status. Maps to **2.0 Friends** and **D2**.
4. **Where messages live** — `messages` table, streamed live via database change-feed. Maps to **6.0 Messaging** and **D6**.
5. **Where payments/budgets live** — `expenses` table + `subscriptions` table for the freemium tier. Maps to **7.0 Payments** and **D7**.
6. **The safety net (RLS)** — one paragraph: "every table has a rule that says 'you can only see rows you're allowed to see, even if you tried to query them directly'. The database, not the app, enforces it."
7. **The demo account guarantee** — Ryan25 auto-reseeds its sample events on every login so the demo is never empty.
8. **Hosting** — runs on Lovable Cloud (managed Postgres + edge functions); no separate server to babysit.

A small **"Likely Q&A" cheat sheet** at the end with 5 questions a reviewer might ask and one-line answers ("What if two people RSVP at the same time?", "How do you stop someone from editing my event?", "What happens at the free-tier cap?", etc.).

## What I will NOT include

- Re-explanations of the DFD, activity diagram, user stories, sprints, or burndown — those are already in the deck.
- Code snippets or SQL — backend section stays in plain English.
- Marketing fluff — every line either gets said out loud or answers a question.

## Process

1. Read `src/routes/_authenticated.events.tsx`, `_authenticated.upgrade.tsx`, and `_authenticated.wrapped.tsx` briefly to make sure the click paths in the script match what's actually on screen (avoid telling the presenter to click a button that doesn't exist).
2. Skim the `mem://features/business-rules.md` and `data-model.md` memories so the backend section names tables that actually exist.
3. Write the Markdown file to `/mnt/documents/LinkUp_Demo_Script_and_Backend_Notes_v2.md`.
4. Emit the `<lov-artifact>` tag so the user can download it.

No code changes, no migrations, no UI work.
