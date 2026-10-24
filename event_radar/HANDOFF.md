# Club Event Radar: handoff notes for Jackson

## 1. What works now

**Website:** https://janaleet.github.io/BUS4498_InClass_Builds/event_radar/

- A club officer pastes an announcement, and can add a flyer photo (JPG or PNG, up to 5 MB).
- The AI agent, the `submit-event` **Edge Function**, turns the post into an event card and checks the posting rules. It answers with one of four results:
  - **Published:** the post is fine and goes straight on the website.
  - **Waiting for a moderator:** something needs a check, and the agent says what.
  - **Not posted:** it isn't an event.
  - **Already posted:** the same date, start time and place is already up.
- Posts with a photo always wait for a moderator.
- The list shows published events, soonest first, with a **Free food** filter.
- A moderator signs in at the bottom of the page and can **Approve** or **Reject** each waiting post.
- Right now there are 3 published posts, 6 rejected and none waiting.

## 2. Where things live

- **GitHub repository:** `janaleet/BUS4498_InClass_Builds`, in the `event_radar/` folder. GitHub Pages serves the website from the `main` branch.
- **Supabase project:** `event-radar`. Its **Project URL** is https://urpkcxwzrojbitdvlzoi.supabase.co
- **Files that matter:**
  - `index.html`, `app.js`, `style.css`: the website.
  - `config.js`: the Project URL and the **publishable key**. Both are public.
  - `supabase/functions/submit-event/index.ts`: the AI agent.
  - `supabase/migrations/`: the database changes, one file per stage (4, 7 and 8).
  - `context/posting-rules.md` and `context/campus-places.md`: the rules and place list. They're also copied inside `index.ts`, so change both together.
  - `test/sample-announcements.md` and `test/sample-flyer.png`: test posts.
  - `AGENTS.md`: instructions for Claude Code or Codex.

## 3. Secrets

- `ANTHROPIC_API_KEY` is set in Supabase → **Edge Functions → Secrets**. The agent uses it to call Claude (`claude-haiku-5-5`).
- Supabase adds `SUPABASE_SECRET_KEYS` and `SUPABASE_URL` to the agent on its own.
- You don't need any of the values. Never put a secret key (`sb_secret_...`), the database password or an AI key in a file or a chat.
- The moderator account is in **Authentication → Users**. Ask me for access instead of sharing a password.

## 4. How to test

Use the posts in `test/sample-announcements.md`:

- **Post B (the messy group-chat post):** should be **Published** as Mustang Pitch Society pitch practice at UU Plaza. It should *not* get the free food tag.
- **Post D (house party):** should be **Waiting**, because it's off campus, mentions alcohol, and has a Venmo handle and a phone number. The handle and the number must not show on the card.
- **Post F (textbook sale):** should be **Not posted**.

Sending the same event twice should give **Already posted**. If the site looks out of date after an upload, press **Cmd + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows).

## 5. What's next

- **Agent out of sync:** the agent running in Supabase (version 3) isn't the same as `index.ts` in the repository. The repository now holds the tested starter-kit version. Pick one and deploy it with JWT verification off, so the running agent matches the files.
- **Database rule name:** the visitor rule in Supabase is named "Visitors can read published events." The Stage 4 file calls it "Anyone can read published events." Both work the same way, but the names should match.
- **Stronger passwords:** turn on **Leaked password protection** in Authentication.
- **Optional nightly clean-up:** add the job that archives past events (see `AGENTS.md`).
- **Ideas:** show the "Already posted" event, let clubs edit a post, and add a calendar view.

## 6. How we take turns

1. **Before you start:** in GitHub Desktop, click **Fetch origin**, then **Pull origin** to download the latest version.
2. **When you stop:** commit your changes with a short note, then click **Push origin** to upload them.
3. **Tell each other** before you start working, so we never change the same files at the same time.
4. Never put a secret or password in a file. Only the Project URL and the publishable key belong in `config.js`.
