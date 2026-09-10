# HireCompass The Universal Tool Feature Overhaul
# AI Mode Redesign: Phase-Wise Feature Plan

---

## Phase 0 — Foundation Work

**The idea:** Before anything user-facing exists, the app needs a place to remember three new kinds of things it currently doesn't track at all: a structured "who this person is" profile for the AI to use, a proper concept of chat conversations that persist and can be revisited later (like history in ChatGPT/Claude), and a lightweight record of what the user actually does in the app (which pages they visit, which features they use) so the AI can be proactively useful instead of starting from zero every time.

**Why it matters:** Every later phase depends on these existing first. Skipping this means retrofitting storage into a half-built feature later, which is always messier.

**What "done" looks like:** the groundwork exists quietly in the background — no visible change to the app yet, but the plumbing is there for everything that follows.

---

## Phase 1 — Onboarding & the "Character Profile"

**The idea:** When someone signs up, walk them through a short guided setup: upload a resume, write a quick bio in their own words, add a project or two if they haven't already, and pick a tone for how they want outreach/communication to sound (formal, casual, direct). Instead of storing all of that as raw text and shoving the whole thing into the AI every time someone asks a question, distill it once into a compact summary — their headline, top skills, a short experience summary, project highlights, career goals, and their tone preference. That compact summary is what the AI actually uses going forward.

**Why it matters:** This is what makes the AI feel like it "knows" the person without costing a fortune in tokens or quota on every single message. The raw resume and full project details still exist and are still usable, just pulled in only when genuinely needed rather than every time.

**Key behavior to get right:** if the person updates their resume, adds a project, or edits their bio later, this summary should quietly refresh itself in the background — the AI should never be working off outdated information about who the person is.

**What "done" looks like:** a new user goes through onboarding once, and every AI interaction afterward reflects an accurate, current, and cheap-to-use understanding of who they are.

---

## Phase 2 — Smart Command Routing (the quota-saver)

**The idea:** Not everything a user says to the AI needs the AI to actually think. "Show me my applications," "take me to interviews," "how many places have I applied to" — these are just navigation or simple lookups. This phase is about recognizing those common, predictable requests and handling them instantly, without ever calling the AI model at all. Only genuinely open-ended or reasoning-heavy requests ("why do I keep failing at the OA stage," "draft a follow-up email") should actually go to the AI.

**Why it matters:** You're on a free-tier AI plan. If every click and every simple question burns a request against that quota, real users will hit limits within minutes of using the app. This phase is what makes the whole "AI-first interface" idea survive contact with real usage.

**Key behavior to get right:** the buttons shown in AI mode for common actions should tie directly into this same fast-path system — clicking a button and typing the equivalent phrase should feel identical and cost nothing extra.

**What "done" looks like:** basic navigation and simple stat lookups never show up as AI usage at all; only genuinely generative requests do.

---

## Phase 3 — Expanding What the AI Can Actually Do

**The idea:** The AI assistant should be able to do everything a person could do by clicking around the site manually — add or update an application, log an interview round, create a reminder, generate a tailored project snippet, draft or send an outreach email, build or reshuffle a day plan, pull up analytics. Anywhere the AI currently falls short of matching a page's functionality, that gap gets closed here.

**Why it matters:** This is what makes "AI Mode" a real replacement for clicking through pages rather than a toy chatbot bolted on the side. If the AI can only do a handful of things, users will bounce back to Custom Mode constantly and the whole redesign loses its point.

**Key behavior to get right:** the AI should always double-check real data before answering questions about someone's applications, counts, or statuses — never guess or remember from earlier in the conversation, always look it up fresh. And conversations should be remembered properly — if someone comes back to a chat later, it should still make sense, without needing to replay the entire history every single time (a short recap of "earlier in this chat" is enough once a conversation gets long).

**What "done" looks like:** there's nothing a person can do through the regular pages that they can't also just ask the AI to do for them.

---

## Phase 4 — The AI Mode / Custom Mode Switch

**The idea:** Give people a clear, always-visible way to choose between two ways of using the app: AI Mode, where a conversation drives everything, or Custom Mode, the traditional page-and-sidebar experience that exists today. This shouldn't be buried in settings — it should sit right next to the account menu, easy to flip at any time.

**Why it matters:** Not everyone wants to talk to an AI for everything, and some tasks are genuinely faster with a traditional UI. Giving people the choice, instead of forcing one paradigm, is what makes this redesign additive rather than disruptive.

**Key behavior to get right:** switching modes should never hide, lose, or restrict access to any feature — it's purely a difference in how you interact with the same underlying app and data.

**What "done" looks like:** anyone can flip between the two modes freely and pick up right where they left off either way.

---

## Phase 5 — The AI Mode Experience Itself (Claude-style interface)

**The idea:** This is the actual conversational interface people will live in. A history panel on the side showing past conversations grouped by how recent they are, much like Claude or ChatGPT. A calm, centered conversation area — not stretched edge-to-edge across the whole screen — with plain, document-like text rather than heavy chat bubbles, especially for the AI's own responses. When the AI actually does something (adds an application, sends an email, builds a plan), that result should show up as a clean little confirmation rather than just a wall of text describing it. Before someone starts typing, show a handful of quick-tap suggestions for common things people ask for — these disappear once an actual conversation starts. Conversations should auto-generate a short title after the first exchange, the same way Claude titles a new chat, so the history panel is actually scannable later.

**Why it matters:** This is the feature people will actually judge the whole redesign by. If it feels cluttered, generic, or slow, it won't matter how good the backend is. The specific things that make an interface feel like Claude rather than a generic chat app are the narrower centered column and the lack of bubble styling on the AI's replies — those two details do most of the work.

**What "done" looks like:** starting a new conversation, having it respond, seeing it get a sensible title, finding it later in history, and having any actions the AI took show up clearly — all of it feeling calm and uncluttered rather than busy.

---

## Phase 6 — Making Sure Custom Mode Isn't a Second System

**The idea:** The existing floating chat widget that already lives inside Custom Mode should plug into the exact same conversation engine and history as AI Mode — same threads, same memory, same capabilities. It just looks different (a small floating panel instead of a full page) because the surface around it is different.

**Why it matters:** Building two separate AI systems — one for each mode — doubles the work forever and guarantees they'll drift apart over time. One brain, two front doors.

**What "done" looks like:** a conversation started in the little chat widget while in Custom Mode shows up seamlessly in AI Mode's full history if someone switches over, and vice versa.

---

## Phase 7 — Quiet Activity Awareness (not tone policing)

**The idea:** In the background, keep a light record of how someone is actually using the app — which pages they visit, which features they touch, whether they've got interviews coming up, whether applications have gone stale without follow-up, whether they haven't touched their day plan in a while. Summarize that into a few plain, factual sentences and let the AI use it to be proactively helpful — "you've got two interviews this week, want a prep plan?" — rather than only reacting to what's typed.

**Important boundary:** this is strictly about what the person does in the app — not how they talk, not their tone, not judging their manners. That kind of behavioral profiling is more trouble than it's worth and risks the AI feeling passive-aggressive toward someone who's already stressed about job hunting. Keep this purely factual and action-based.

**What "done" looks like:** the AI occasionally surfaces genuinely useful, well-timed suggestions grounded in real activity, and never anything that feels like it's judging how the person is behaving.

---

## Phase 8 — Stress-Testing Before Launch

**The idea:** Before real users touch this, deliberately try to break it. What happens when the free AI quota runs out mid-conversation? What happens if someone's profile is out of date because they just edited a project? What happens if a background action (sending an email, saving to the database) hangs or fails silently? Every one of these situations needs a graceful, honest response instead of a broken or confusing one.

**Why it matters:** This is the difference between a demo that works and a product that survives real usage without embarrassing failures.

**What "done" looks like:** every failure mode has been deliberately triggered once, and in every case the app told the user clearly what happened and gave them a way forward — never a silent break or a wrong answer presented confidently.

---

## Build order

Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

The one sequencing point worth protecting: build Phase 2 (smart command routing) before Phase 5 (the visible interface). If the interface gets built first, it's very easy to end up with something that looks great in a demo and then falls over the moment real people use it, because every interaction was quietly burning through the free quota.