## Goal
Create a polished **demo script** you can read off during your LinkUp capstone presentation. It will walk through the live demo flow (sign up → events → friends → messages → calendar → upgrade) AND include "behind the scenes" backend talking points (auth, database, RLS, freemium logic, payments).

## Format
I'll deliver it as a **`.docx` file** in `/mnt/documents/LinkUp_Demo_Script.docx` so you can print it, edit it, or pull it up on a second screen during the demo. (If you'd rather have a `.pdf` or `.pptx` speaker-notes deck, just say the word before I start.)

## Structure of the script

1. **Cover page** — LinkUp, capstone group, date, presenter cues.
2. **Opening hook (30s)** — "Group chats are where plans go to die" pitch, target = Gen Z friend groups.
3. **Section 1 — Sign up flow**
   - What to click: Sign Up → fill form → land on Events
   - Talking points: BR001 username uniqueness, BR002 password rules, Google OAuth, profile auto-creation via `handle_new_user()` trigger
4. **Section 2 — Events page (core feature)**
   - Create event, invite friends, RSVP, group to-do list, guest list
   - Talking points: Events vs Groups distinction, freemium cap (1 event/month free), RLS so only friends see your events
5. **Section 3 — Friends**
   - Add friends, accept requests
   - Talking points: friendship graph drives event visibility
6. **Section 4 — Messages**
   - Direct chats + auto-created event group chats (`get_or_create_event_chat` function)
   - Talking points: realtime via Supabase channels, host-only delete for event chats
7. **Section 5 — Calendar**
   - Unified view of every RSVP'd event
8. **Section 6 — Upgrade / Premium**
   - Show pricing ($60/yr individual, $144/yr group, lifetime option)
   - Talking points: Stripe sandbox checkout, `has_active_premium()` server-side check, mock subscription state for demo
9. **Section 7 — "Behind the scenes" backend slide**
   - Stack: TanStack Start + React 19 + Tailwind v4, Lovable Cloud (Postgres + Auth + Edge Functions + Storage)
   - Security: Row-Level Security on every table, separate `user_roles` pattern, server-side premium validation
   - Data model highlights from your class diagram (User, Event, RSVP, Task, Message, Conversation, Subscription)
10. **Closing (30s)** — what's next, ask for questions.
11. **Appendix — Demo reset checklist** — log out, clear mock subscription, which test account to use, fallback if wifi dies.

## Style
- Each section has **[ACTION]** (what to click) and **[SAY]** (verbatim talking points) blocks so it reads like a real script, not a feature list.
- Estimated time per section in the margin so you can hit a target length (I'll target ~6–7 min total, adjustable).
- Plain language for the audience-facing parts; technical depth reserved for the "Behind the scenes" section.

## What I need from you (optional)
- Target demo length (default: 6–7 min)
- Who's presenting which section, if you want names baked in
- Any feature you want to skip or emphasize

If you don't answer, I'll use sensible defaults and you can tweak after.
