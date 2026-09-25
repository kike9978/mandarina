# Phase 1 — Foundation & Learning Journey

**Goal:** Ship a mobile-first PWA where the learner can complete one authored vertical slice of the journey — from home “Continue” through Encounter → Understand → Recall → Reconstruct → Produce — with **invisible local scheduling**, playful UI, and no in-app calls to a cloud model. Curriculum can still grow: the learner copies a progress brief into any chat model they already use, then pastes the JSON pack back so Mandarina schedules it like any other stash.

**Maps to original plan:** Phases 1–2 (Foundation + Learning Core), rewritten around the learner journey instead of skill modules.

**North star:** *The learner should never have to understand the learning system in order to benefit from it.*  
**Surface principle:** *Play on the surface, rigor underneath.*

---

## Phase outcomes

By the end of Phase 1 the app can:

1. Install as a PWA and run offline for core learning.
2. Answer on Home: **what am I learning / why / what next?**
3. Run a guided session for one learning unit (phrase cluster).
4. Bridge activities without dumping the learner back to a skill menu.
5. Persist learner state, facet progress, and FSRS schedules locally.
6. Soft-handle failure (“Not quite” → hint → retry → reveal → later revisit).
7. Celebrate checkpoints with playful feedback (no hollow XP spam).
8. Show progress as **abilities** (“I can…”) rather than Vocab/Grammar % bars.
9. Feel unmistakably **playful** in the Game Builder Garage / lesson-map sense (workshop grid, path adventure, guide, celebrations) — not a SaaS toolkit.
10. Let the learner **stash** phrases/vocab and optionally **import** simple local packs so learning isn’t limited to seed curriculum or cloud AI.
11. Let the learner **grow the journey by hand**: copy a progress brief, paste it into any chat model, and bring back a JSON pack that enters the same stash path. The app never calls the model.

**Out of scope for Phase 1:** live AI conversation, Deno proxy, Groq/Gemini, Whisper, in-app model calls, full multi-script expansion, cloud sync, accounts, Anki `.apkg` import (defer), live web dictionary APIs as the core path. The hand-carried tutor pack is in scope; Boss Challenge as a live conversation stays Phase 2.

---

## Assumed product decisions (lock before build)

| Decision | Phase 1 assumption | Notes |
|---|---|---|
| First language | Japanese (can swap if you decide otherwise) | Drives curriculum fixtures + hiragana/kanji writing prep for Phase 2 |
| Primary unit | Phrase-cluster learning unit | e.g. `今日は仕事があります。` |
| Navigation | Home · Journey · Practice · Progress | No Vocab/Grammar/AI tabs |
| Mastery model | Multi-facet per item (not one boolean) | recognition, listening, production, writing, contextualUse |
| Reviews | Invisible SRS language | “Let’s bring a few things back” — never “37 FSRS due” |
| Gamification | Light & meaningful | Momentum, checkpoints, session clear, ability unlocks |
| Learner content | Stash + simple import + tutor pack | Phrases preferred; feeds same orchestrator — not a separate Anki app |
| Tutor pack | Clipboard only | App writes the brief and reads JSON back. Learner carries both. No API key, no proxy |
| Local dictionary | Bundled subset + Fuse.js | Lookups offline; no live API required |
| Auth / cloud DB | None | Local-first personal MVP |

---

## Architecture snapshot (Phase 1)

```text
REACT PWA (Vite or Next — pick one and stick)
  ├─ Playful UI shell (design tokens, motion, guide, atmospheres)
  ├─ Routes: Home / Journey / Practice / Progress / Session / Stash
  ├─ Activity components (Spot It, Build It, Your Turn, …)
  ├─ Session orchestrator (readiness + bridges + momentum)
  ├─ Curriculum fixtures (abilities → units → items)
  ├─ Learner stash & import (user phrases → same item/facet model)
  ├─ Tutor pack (progress brief out · JSON pack in · same stash path)
  ├─ Optional local dictionary pack (Fuse.js)
  ├─ Dexie / IndexedDB
  │    ├─ learner profile & settings
  │    ├─ seed + user items / units
  │    ├─ item facet states
  │    ├─ FSRS card records (per facet)
  │    ├─ session / attempt history
  │    └─ learning signals
  └─ ts-fsrs (local scheduling)
```

The app makes **no model calls** in Phase 1. Live conversation (Deno / Groq / Gemini) stays **Phase 2**. Stash, file import, the tutor-pack clipboard, and the local dictionary are **on-device** — they reduce reliance on authored seed content and on Phase 2 backend features. The learner may still use a chat model they already pay for; Mandarina only hands them the brief and accepts the pack.

---

# Part A — Pure Frontend

*Build the entire learner-facing experience against fixtures/mocks. No Dexie, no FSRS, no persistence required yet — in-memory or static JSON is enough so UX and flow can be validated first.*

## A1. Project & app shell

### Deliverables

- Mobile-first app scaffold with routing.
- Bottom nav: **Home · Journey · Practice · Progress**.
- Safe-area aware layout; thumb-friendly primary CTA.
- Installability stubs (manifest + icons); full offline caching can wait for Part B.
- Theme tokens for the playful identity (not default SaaS purple / cream-serif).
- **`lucide-react`** as the sole UI icon set (see project rule `.cursor/rules/playful-visual-language.mdc`).

### Design system (frontend-only)

Follow **`.cursor/rules/playful-visual-language.mdc`** (Lucide + reference visual language). Define CSS variables / tokens for:

- Background atmospheres (yellow **grid paper** workspace, soft **sunburst**, celebration field)
- Primary / secondary / accent / success / soft-error — saturated yellow, orange, cyan (active), magenta accents, mint success
- Display + body fonts (expressive, non-default stacks — no Inter/Roboto/Arial as brand)
- Radii, **thick soft outlines**, chunky frames (lesson preview, path nodes, choice panels)
- Motion durations (path advance, success pop, celebration)
- Selected CTA treatment (e.g. cyan + diagonal stripe) vs simpler secondary

### Playfulness reinforcement (all references)

Phase 1 UI must read as a **playful creative workshop / adventure lesson**, not a productivity app with stickers. Bake these reference patterns into tokens and components:

| Reference beat | Mandarina application |
|---|---|
| Yellow grid “blueprint” workspace | Default session + Journey ground — grid paper, not flat white/gray |
| Orange “Game Screen” frame | Optional preview / example sentence frame with thick playful border |
| Magenta logic connectors / Nodons | Path links and step nodes feel connected and characterful (simple shapes OK; no need for literal Nodons) |
| Speech bubble + game-show choices | `GuideBubble` + `SoftChoice` (“Why not!” / “Nah…”) energy on briefs and Boss Challenge shell |
| Cyan selected / striped primary CTA | Active path node + recommended Start/Confirm |
| Winding numbered lesson path | `PathMap` is the unit spine — adventure progression, not a checklist |
| Split sunburst sky + yellow grid | Journey / Lesson header atmosphere |
| Guide tab with peering eyes / helper | Persistent guide personality; Y-prompt energy becomes tap affordance |
| (A)/(B) Confirm / Back console clarity | Big labeled Confirm + Back in session chrome (Lucide, not letter glyphs required) |
| Mint sunburst “Game Complete!” | Session clear celebration — crown, date/ownership flourish optional |
| Purple grid “All Clear!” + neon crown | Alternate checkpoint motif for major clears (use sparingly; don’t theme the whole app dark-purple) |
| Skyrim constellation / per-skill levels | Progress only: ability cosmos + independent facet feel — never the Home hero |

**Playfulness checklist (every major screen):**

1. Atmosphere present (grid, sunburst, or celebration field) — no barren flat chrome.
2. At least one expressive element (guide bubble, path node, chunky frame, or crown).
3. One clear recommended action visually louder than the rest.
4. Copy sounds like a host/coach, not a settings panel.
5. Motion on state change (path advance, success pop, or clear) when `prefers-reduced-motion` allows.

**Anti-patterns:** dense card dashboards, hairline enterprise tables, purple SaaS gradients, cream+terracotta cliché, XP toasts on every tap, emoji as nav.

### Icons (Lucide)

| Area | Suggested Lucide icons |
|---|---|
| Bottom nav | `Home`, `Map`, Practice (`Dumbbell` or `Sparkles`), Progress (`Trophy` or `Compass`) |
| Session chrome | `Undo2`, `Redo2`, `Pause`, `Play`, `Volume2`, `Mic` |
| Checkpoint / clear | `Crown` |
| Soft feedback | `CircleHelp`, `Lightbulb`, `Check` |
| Soft Home rows | `RotateCcw` (comeback), `Pencil` (characters), `MessageCircle` (milestone), `BookmarkPlus` (stash) |
| Tutor pack | `ClipboardCopy` (copy the brief), `ClipboardPaste` (bring the pack back) |

No emoji as primary nav/controls. Icon + label in bottom nav; touch targets ≥ 44px.

### Components to ship (presentation)

| Component | Role |
|---|---|
| `AppShell` | Frame + bottom nav (Lucide + labels) |
| `GuideBubble` | Character/guide speech + optional hint |
| `PrimaryCta` | Game-show style Confirm / Start |
| `SoftChoice` | Recommended vs secondary choice |
| `CheckpointBadge` | Lucide `Crown` / “All Clear!” motif |
| `PathMap` | Winding numbered unit steps; active = cyan double-outline |
| `AbilityList` | “I can…” with ✓ ◐ ○ |
| `MomentumBanner` | “You’re warmed up. Keep going.” |
| `SessionChrome` | Step label, path progress, Back (Lucide) |
| `SoftFeedback` | Not quite / hint / try again / answer |
| `StashSheet` | Playful quick-add phrase / from-context save |
| `PackImport` | “Bring a pack aboard” file flow |
| `TutorPackSheet` | Copy a progress brief; paste JSON back; preview before it joins the library |

### Acceptance

- First viewport of Home reads as one composition: greeting, journey context, one Start CTA — not a skill dashboard.
- Brand / product presence is strong enough that removing nav still feels like Mandarina.
- UI matches reference visual language (grid/sunburst atmosphere, thick outlines, cyan active states) and uses Lucide consistently.
- Visual rule file respected: `.cursor/rules/playful-visual-language.mdc`.

---

## A2. Information architecture & copy

### Screens (static / fixture-driven)

1. **First launch (wizard UI only)**  
   Choose language → rough starting ability → goal → enter Home.
2. **Home**  
   - Greeting + journey day count  
   - TODAY: Continue lesson (duration estimate + activity count) — **one hero composition** on grid/sunburst  
   - Soft secondary: comebacks phrased humanly, characters to practice, conversation milestone (mocked), **“Stash something new”**  
   - SoftChoice energy on primary vs secondary when offering challenge/postpone later
3. **Journey**  
   Current ability path (“Getting around town”) + **winding** unit map steps 1…n on yellow grid  
   Active step = cyan double-outline; completed steps feel lit; locked steps quiet  
   Optional guide tab peeking (“Alice’s Guide”–style personality)
4. **Practice**  
   Explains that the app picks activities; optional “Start a session” that launches the orchestrated flow with fixtures.  
   Not a menu of Vocab/Grammar/Speaking tiles.
5. **Progress**  
   Ability checklist (“I can…”) + optional light **constellation / skill-focus** mock (Skyrim-inspired, secondary only).  
   No Vocab/Grammar % bars as the hero.
6. **Stash (learner content UI)**  
   Quick-add phrase flow — playful “Stash it” sheet, not an admin form (see A6).  
   **Grow the journey** lives here too: copy a brief, paste a pack back (see A7). Not a new tab.
7. **Session runner**  
   Full activity sequence UI for one unit — workshop grid, guide bubble, path chrome.
8. **Session complete**  
   Mint sunburst **or** crown “All Clear!” celebration with playful motion; then return Home.  
   Optional quiet line after the checkpoint — “Want more phrases?” — links to the tutor pack. It never outshouts Back to Home.

### Playful activity naming (lock copy)

| Internal step | Learner-facing name | Cognitive job |
|---|---|---|
| Encounter | Meet It | Comprehensible input, no quiz |
| Notice | Spot It | Tap / highlight meaning |
| Understand | Break It Down | Meaning, form, pronunciation |
| Recall | Your Turn | Retrieve without looking |
| Reconstruct | Build It | Arrange / rebuild phrase |
| Produce | Say It / Write It | Independent production (Write It may be stubbed) |
| Use | Boss Challenge | Communicative use — **UI shell only in Phase 1** |
| Revisit | Comeback | Soft review framing |

### Copy principles

- Energetic, clear, **game-show / coach** tone without burying the task.
- Never expose FSRS, intervals, or “due cards” jargon.
- Failure: “Not quite” → hint → retry → reveal — never harsh ❌ WRONG as primary state.
- Celebrations: “All Clear!”, “Game Complete!” energy for session/ability clears; reserve quieter copy for mid-activity success.
- Stash / import: “Stash it”, “Add to my journey”, “Bring a pack aboard” — not “Create card” / “Import CSV”.
- Tutor pack: “Grow the journey”, “Copy the brief”, “Bring the pack back” — not “Export prompt”, “LLM”, “API”, or “JSON schema” as the primary labels. The paste field can say the answer should be a pack.

### Acceptance

- A new user can walk the happy path using only on-screen language.
- Secondary Home rows never require understanding SRS.
- SoftChoice / guide bubble appear at least on first-launch exit, Home Start, and session clear.

---

## A3. Learning journey UI (one vertical slice)

Author **one complete unit** in frontend fixtures, e.g.:

> Target sentence: `今日は仕事があります。`  
> Items: `今日`, `仕事`, `ある` / `あります`, pattern `〜があります`

### Session storyboard (frontend)

```text
Home [START]
  → Meet It        (read/hear sentence + support gloss)
  → Spot It        (tap 今日, 仕事)
  → Break It Down  (meaning + light pattern note)
  → Your Turn      (recognition / meaning recall)
  → Build It       (reorder chunks)
  → Say It         (prompt + typed or mic-stub response UI)
  → (Boss Challenge shell: “Coming up when you’re ready” OR mocked scripted turns)
  → Checkpoint     All Clear!
  → Home (updated fixture state)
```

### Bridging rule (UI)

Each screen’s outro should **announce the next cognitive move**, e.g.:

- After Spot It: “Nice — now let’s make sure you can find them again.”
- After Build It: “You’ve got the pieces. Your turn to say it.”

No return-to-menu between activities unless the learner exits.

### States to implement in UI

- `locked` · `available` · `active` · `completed` · `needs_retry` for path nodes
- Soft failure overlay with 1–2 hint levels
- Momentum banner after a streak of successful recalls (fixture-triggered)

### Acceptance

- Completing the fixture session feels like one continuous tutor flow.
- PathMap advances visibly after each step.
- Boss Challenge may be non-functional but visually reserved as the Use stage.

---

## A4. Progress & gamification (frontend-only)

### Include

- Daily **momentum** messaging (warmed up / keep going / welcome back).
- Session completion celebration (mint **sunburst** and/or purple-grid **crown “All Clear!”** motif — pick one primary, keep the other for major milestones).
- Checkpoint on unit path (numbered nodes light up like an adventure map).
- Ability unlock UI when fixture marks an ability complete — constellation node “ignites.”
- Optional cosmetic level number tied to abilities unlocked (display only).
- Sound/haptic hooks as no-ops or browser vibrate stubs (full polish later) on clear / path advance.

### Explicitly avoid in Phase 1 frontend

- XP for every correct tap.
- Punitive streak death UI.
- Leaderboards.
- Falling-character mini-games as core UX.
- Turning Progress into a Skyrim clone that overshadows “I can…” abilities.

### Acceptance

- Rewards fire on **session clear**, **ability unlock**, and **comeback success** — not on every micro-interaction.
- Progress screen answers “what can I do in the language?” not “how many cards?”
- Celebration screens feel like a dedicated moment (full-bleed atmosphere), then exit cleanly to Home.

---

## A5. Frontend quality bar

- Responsive: phone-first; usable at 360×640.
- Motion: at least 2–3 intentional motions (path advance, success pop, celebration).
- Accessibility: focus order, labels on icon buttons, reduced-motion preference respected.
- Empty / offline-looking states designed even if mocked — still on-brand (grid + guide), not blank gray.
- Storybook or route-based gallery optional but helpful for activity components.
- Visual QA against the playfulness checklist in A1 (atmosphere, expressive element, loud CTA, coach copy, motion).

---

## A6. Stash, library & external packs (frontend-only)

*Learner-authored content and simple imports so Phase 1 isn’t limited to seed units or Phase 2 AI. Fixtures/mocks first; wire in Part B.*

### Principles

- Stash **feeds the journey engine** — never becomes a competing “flashcard app” home.
- Prefer **phrases + example sentence**; gently nudge bare words: “Got a sentence this showed up in?”
- Playful sheet UI on grid paper; Lucide `Plus` / `BookmarkPlus` / `PackageOpen` — no emoji-primary.
- Home stays “Continue first”; Stash is a **quiet secondary** entry.

### Flows to mock

1. **Stash it** — surface (required), gloss (required), reading (optional), example sentence (strongly encouraged), optional ability tag (“helps me: Order food”).
2. **Word from context** — from Meet It / Spot It, “Stash this” on a tapped span (pre-filled surface + parent sentence).
3. **My phrases library** — browse stashed items; primary action is “Practice these” → mock orchestrator queue, not endless edit mode.
4. **Bring a pack aboard** — file picker for simple JSON/TSV; success = playful confirmation, then items appear in library.
5. **Local look-up (optional UI)** — search box over a fixture dictionary subset; “Stash from look-up.”

### Template bridge (UI storyboard for a stashed phrase)

```text
Stash saved
  → Meet It (their sentence)
  → Spot It / Break It Down
  → Your Turn
  → Build It
  → Say It
  → (Boss Challenge deferred / shell)
  → All Clear!
```

Same activity names and soft-failure language as seed units.

### Explicitly defer

- Anki `.apkg` import  
- Live translation / online dictionary as the default path  
- The app calling a model to write examples (the learner may do that themselves — see A7)

### Acceptance

- Learner can add a phrase and walk a fixture bridge without opening a skill menu.
- Stash never replaces Home Continue as the default CTA.
- Import mock accepts a tiny sample JSON/TSV and shows items in the library UI.

### Part A exit criteria

- [ ] Design tokens + shell + nav shipped (Lucide + labels)
- [ ] Home / Journey / Practice / Progress (+ Stash entry) complete against fixtures
- [ ] One full unit session playable end-to-end (mock data)
- [ ] Soft failure + celebration flows polished (sunburst and/or crown All Clear)
- [ ] Playful copy locked for core activities + stash language
- [ ] Playfulness checklist passed on Home, Journey, Session, Clear
- [ ] Visual language rule satisfied (grid/sunburst, thick outlines, no emoji-primary icons)
- [ ] Stash + pack-import UIs demoable with fixtures
- [ ] Tutor-pack sheet demoable: copy a fixture brief, paste sample JSON, see phrases in the library
- [ ] No cloud calls required to demo Phase 1 UX

---

## A7. Tutor pack — brief out, JSON back (frontend-only)

*A hand-carried curriculum step. The learner copies a progress brief into any chat model, then pastes the pack back. Mandarina never opens a network connection for this. Fixtures first; wire the real snapshot in Part B.*

### Principles

- Same door as stash. A brought-back pack is learner content, practiced on the template bridge — not a second home and not a live Boss Challenge.
- Home stays “Continue first.” Entry is Stash (“Grow the journey”) plus an optional quiet line on All Clear.
- The brief describes the learner in coach language. It never includes intervals, stability, card ids, or “due cards.”
- The model proposes phrases. It does not set schedules, mark abilities done, or skip Meet It.
- Preview before commit. The learner sees the phrases and can reject the pack.
- One step ahead. A few phrases that reuse what they know and add one new move — not a vocab dump.

### Flow to mock

```text
Stash → Grow the journey
  → Guide explains: copy this note into a tutor you already use, then bring the answer back
  → Brief (read-only) + Copy the brief
  → Paste field
  → Preview (“Pack aboard — 4 phrases”) with Why not! / Nah…
  → Phrases appear in the library
  → Practice these (same bridge as A6)
```

Part A may use a **fixture brief** (fixed “talk about today” snapshot) so the sheet is demoable before Dexie. The paste parser still runs for real: extract JSON, validate, show the preview.

### Brief contents (what the copied note includes)

The note is plain text the learner can paste anywhere. It tells the model:

- Target language, writing familiarity, and the goal they picked (daily life, travel, work, or fun). This is the first place `goalId` steers content — the seed unit does not.
- Abilities as “I can…”, each done, in progress, or not yet.
- Language they already have: surface, reading, gloss, and example sentence when present (seed + stash). Ask the model not to repeat these.
- Soft weak spots only: items they missed, hinted, or had revealed, and which skill was shaky (recognize, hear, say, write, use). No numbers that look like a deck.
- A cap of **3–8 phrases**.
- The reply contract below, and the line: reply with only that JSON.

**Progress rules baked into the brief** (so a fixture and the later generator say the same thing):

| Learner state | What the brief asks for |
|---|---|
| New to a non-Latin script, writing warm-up not cleared | A few more marks in the same family as the warm-up, each with reading, hint, and a tiny example — not a dense sentence |
| Latin-script language, or script already comfortable | Phrases first; spelling notes only if they marked sounds as new |
| Current ability still in progress (e.g. “Talk about today”) | Reuse known pieces (“today”, “I have”) and add one neighbor move |
| Recent misses are on saying / building | More example sentences of words they already know, not a pile of new words |
| Language has no seed phrase unit yet (Mandarin, Korean, Arabic in the current slice) | The first useful phrase cluster for their goal — this pack is the curriculum |

### Reply contract (v1)

The app accepts the same rows as file import, so a pack from a model and a pack from a file share one parser.

```json
[
  {
    "surface": "水をください",
    "gloss": "Water, please",
    "reading": "みずをください",
    "exampleSentence": "水をください。"
  }
]
```

| Field | Required | Notes |
|---|---|---|
| `surface` | yes | Phrase preferred; a bare word is allowed |
| `gloss` | yes | Learner-language meaning |
| `reading` | no | Kana, pinyin, romanization |
| `exampleSentence` | strongly encouraged | Unlocks Build It / Say It. Without it, practice stays Meet → Spot → Break It Down → Your Turn |
| `abilityTag` | no | Optional “helps me…” label, same as the stash sheet. Display only in Phase 1 — it does not unlock an ability |

Parser behavior for the mock and the engine:

- Accept a raw array or a ```json fence with chatter around it. Take the first array.
- Drop rows missing `surface` or `gloss`.
- Trim strings. Skip empty packs with a coach line (“Hmm — no phrases in that pack”).
- Skip surfaces already in the library or the seed unit, and say how many were already aboard.
- Do not trust extra fields (`due`, `mastery`, `status`, `reps`). Ignore them.

### Copy

- Sheet title: **Grow the journey**
- Primary: **Copy the brief**
- Paste action: **Bring the pack back**
- Success: **Pack aboard — N phrases ready when you are**
- Guide: “I’ll write a note about where you are. Paste it to a tutor, then bring their pack back here. I won’t talk to them myself.”

### Explicitly defer

- Sending the brief to a provider from the app
- Letting the pack replace the seed Journey path or mark “Order food” done
- A richer unit object (`buildChunks`, turn options, boss scene) until a real imported-unit record exists — v1 is stash rows only
- Storing the chat transcript

### Acceptance

- Copy puts the brief on the clipboard (or selects it, if clipboard permission fails) with no network request.
- Pasting the sample pack JSON shows a preview, then the phrases in the library.
- A fenced reply and a bare array both parse. A reply with no phrases does not wipe the library.
- Home Continue is unchanged. Practice these on the new rows uses the A6 bridge.
- Learner-facing copy never says FSRS, SRS, or “due cards.”

---

# Part B — Backend / Local Engine Integration

*Wire the Part A UI to a real local learning engine. “Backend” here means on-device persistence + scheduling (+ optional thin static hosting). No AI provider integration yet.*

## B1. Stack & storage

### Deliverables

| Piece | Choice (from plan) | Responsibility |
|---|---|---|
| Local DB | Dexie.js / IndexedDB | Profile, curriculum cache, facets, FSRS, attempts, signals |
| SRS | `ts-fsrs` | Schedule per facet |
| PWA | Workbox / Vite PWA plugin | App shell + curriculum asset caching |
| Search | Fuse.js | Local fuzzy dictionary / library search |
| Hosting | Static / PWA host | $0 target |
| TTS (optional) | Web Speech API | Meet It / listening without cloud |

### Schema direction (implement v1)

```text
LearnerProfile
  id, displayName, nativeLang, targetLang, goal, createdAt, streakDays, lastActiveAt

Ability
  id, languageId, title ("Order food"), sortOrder, status
  source (seed|user)

LearningUnit
  id, abilityId?, title, targetSentence, targetGloss, estimatedMinutes
  source (seed|user|import)
  bridgePlan JSON

Item
  id, unitId?, surface, reading?, gloss, type (word|pattern|character|phrase)
  source (seed|user|import)
  exampleSentence?, parentItemId?
  abilityId?   // optional tag for Progress

ItemFacet
  itemId, facet (recognition|listening|production|writing|contextualUse)
  stability, difficulty, due, reps, lapses
  masteryHint 0–100 (derived, optional display)

FsrsCard
  id, itemId, facet, fsrsState JSON, due

Session
  id, startedAt, endedAt, unitId?, kind (journey|comeback|mixed|stash)

Attempt
  id, sessionId, activityType, itemId?, facet?, outcome, hintsUsed, latencyMs, payload JSON

LearningSignal
  id, source (attempt|manual|import), itemId, facet, strength, createdAt, consumedByScheduler?

ContentPack
  id, name, importedAt, itemCount, format (json|tsv|paste)

Settings
  key, value  (TTS voice, reduced motion, guide name, stashNudgePhrases, etc.)
```

Exact FSRS field mapping should follow `ts-fsrs` types; keep a clear adapter layer so UI never imports FSRS directly.

### Acceptance

- App boots with empty or seed DB; survives reload.
- Migrations strategy documented (Dexie version bumps).
- User/import rows coexist with seed without colliding IDs.

---

## B2. Curriculum as data

### Deliverables

- Seed at least **one ability**, **one unit**, and linked **items** matching the Part A fixture.
- Loader that hydrates Dexie on first launch (idempotent).
- Content format (JSON or TS modules) suitable for adding units without UI rewrites.

### Authoring rules for Phase 1 content

- Prefer phrases / patterns over isolated words.
- Each unit declares an ordered **bridge plan** (activity sequence + target facets).
- Mark which steps are required before Produce / Use.

### Acceptance

- Wiping IndexedDB and reloading restores seed curriculum.
- Second unit can be added by content file only (minimal code change).

---

## B2b. Learner stash, imports & local dictionary

### Deliverables

1. **Stash API** — create item (+ optional mini-unit) from UI; `source: user`; create facets; schedule first Encounter/Meet It appropriately (Encounter may be marked complete if they typed the sentence themselves).
2. **Template bridge generator** — from `surface + gloss + exampleSentence`, produce the same activity sequence as seed units (Meet It → … → Say It).
3. **Context stash** — save tapped span with parent sentence as `exampleSentence`.
4. **JSON/TSV import** — parse pack → `ContentPack` + items; validate minimally; reject empty rows; playful success counts in UI.
5. **Interleaving** — comeback / mixed sessions include due **user** items alongside seed (cap totals; absence policy still applies).
6. **Local dictionary pack** (recommended for Japanese MVP) — ship or download-once a **subset** JMDict-style JSON; Fuse.js search; “Stash from look-up” writes local items only.
7. **Export backup** (nice-to-have) — dump user items/packs as JSON for device transfer without a server.
8. **Tutor-pack brief** — build the A7 note from the live profile, abilities, known items, and open learning signals. Clipboard only.
9. **Tutor-pack ingest** — same parser as JSON import; `source: import`; `ContentPack.format: paste`; empty FSRS cards (not due until practiced); preview already confirmed in the UI.

### Pedagogy rules (enforced in engine)

- Nudge or require example sentence before unlocking Build It / Say It for stashed isolates.
- Do not dump all new stashes into tomorrow’s due pile — introduce via short “fresh stash” warm-up or next Continue mix.
- Readiness gates identical to seed items (recognition before hard production).
- Library browse ≠ study start; “Practice these” calls orchestrator.

### Explicitly out of scope here

- Anki `.apkg`  
- Cloud translation / live dictionary APIs as required dependency  
- The app calling a model to write examples (learner-carried packs are in scope)

### Acceptance

- Stash → reload → item still present with facets.
- Imported TSV/JSON appears in library and can enter a real session queue.
- Airplane mode: stash + import file from disk + copy brief + paste pack + dictionary subset (if bundled) all work.
- A pasted pack does not appear in comebacks until the learner has practiced it.
- The brief omits FSRS fields even if the debug drawer can see them.
- Home Continue still prioritizes journey/comeback language; stash is additive.

---

## B3. Session orchestrator (local)

### Responsibility

Given learner state + due facets + current unit, decide:

1. Session kind: **journey** (new/continue unit) vs **comeback** (spaced revisit) vs **welcome back** (long absence) vs **stash** (learner-content bridge).
2. Ordered activity queue with bridges (seed **or** template-generated for user items).
3. When to insert soft reviews without showing a review dump.
4. When to stop demanding Produce (readiness gates).
5. How to **interleave** due user items with curriculum without derailing the current ability path.

### Readiness policy (v1)

```text
New item
  → Encounter / Spot It / Break It Down
  → Recognition success rate ≥ threshold?
        No  → more exposure activities
        Yes → Recall (Your Turn)
              → success? No → guided recall / Build It
                            Yes → Produce (Say It)
```

Thresholds can be simple (e.g. 2 correct in last 3 recognition attempts) — tune later.

### Momentum policy (v1)

- After N successful recalls in-session → prefer Build It / Say It using the **same** items.
- Do not bounce to unrelated grammar UI.

### Comeback / absence policy (v1)

- If `lastActiveAt` > 5 days: **do not** dump full due queue.
- Start with short warm-up of high-value items + encouraging copy.
- Cap initial due items aggressively.

### Invisible SRS language

| Engine | UI |
|---|---|
| 12 facets due | “Let’s bring a few things back” |
| Writing facets weak | “3 characters to practice” |
| Unit mid-progress | “Continue your lesson · 18 min” |
| Fresh user stashes | “You stashed 2 phrases — want to lock them in?” |
| Pack imported | “Pack aboard — 24 phrases ready when you are” |
| Tutor pack pasted | Same line; phrases wait for “Practice these” |

### Acceptance

- Home CTA always launches a concrete queue from the orchestrator.
- Learner never selects FSRS parameters.
- Absence path verified with manipulated `lastActiveAt` in dev tools.

---

## B4. Wire UI → engine

### Integrations

| UI | Engine |
|---|---|
| Home Continue | `orchestrator.startDaily()` |
| PathMap | unit step state from attempts + bridge plan |
| Spot It / Your Turn / Build It | write `Attempt` + update facet via FSRS rating |
| Soft failure | attempt outcome `hint` / `fail` / `success`; schedule accordingly |
| Session complete | close `Session`, maybe unlock ability if unit goals met |
| Progress | derive from Ability status + optional facet aggregates |
| MomentumBanner | derived from in-session success streak |
| StashSheet | create user item/unit + facets; optional enqueue |
| PackImport | parse → ContentPack + items |
| TutorPackSheet | progress snapshot → brief text; pasted JSON → same ingest as PackImport |
| Dictionary look-up | Fuse search → optional stash |

### Rating mapping (suggestion)

| Learner outcome | FSRS rating |
|---|---|
| Success first try | Good / Easy (tune) |
| Success after hint | Hard |
| Fail then revealed | Again |
| Partial reconstruct | Hard |

Keep mapping in one module for later tuning.

### Acceptance

- Reloading mid-unit restores position.
- Due dates change after attempts (inspect DB).
- Next-day Home reflects comeback vs continue correctly (clock mocking OK).

---

## B5. PWA & offline

### Deliverables

- Service worker caches app shell + seed curriculum assets + **bundled dictionary subset** (if used).
- Offline: Home, Journey, Practice session, Progress, **Stash**, **file import**, and **tutor pack** (copy + paste) all work. The chat model is outside the app; Mandarina does not need to be online to write the brief or accept the pack.
- Online-only badges reserved for Phase 2 AI features (hidden or “needs connection” stubs).

### Acceptance

- Airplane mode demo completes a full unit session from cache.
- Airplane mode: stash a phrase + import a local sample pack + paste a tutor pack.

---

## B6. Dev tooling & observability (local)

- Seed / reset database button (dev only).
- Debug drawer: current queue, facet dues, FSRS dates (never in learner UI).
- Basic attempt logging for tuning bridges.

---

## Part B exit criteria

- [ ] Dexie schema v1 + migrations (incl. `source`, ContentPack, exampleSentence)
- [ ] Seed curriculum for one ability/unit
- [ ] Stash + JSON/TSV import persist and schedule via template bridges
- [ ] Tutor brief built from real progress; pasted JSON persists as import stash and does not schedule until practiced
- [ ] Local dictionary subset searchable (or explicitly deferred with issue note)
- [ ] `ts-fsrs` adapter per facet
- [ ] Orchestrator drives Home + session queue (seed + user interleave)
- [ ] Attempts persist; schedules update
- [ ] Soft absence / comeback behavior
- [ ] PWA offline for core loop + stash/import
- [ ] Progress abilities update from real completion
- [ ] Part A UI fully switched from fixtures to engine (fixtures remain for tests)

---

## Phase 1 testing plan

### Frontend (Part A)

- Walkthrough script for first-launch → session clear.
- Visual check at 360 / 390 / 430 widths against **playfulness checklist**.
- Reduced-motion path.
- Copy review for jargon leaks (FSRS, SRS, “due cards”) and stash tone.
- Stash + pack-import UI walkthrough.
- Tutor pack: copy brief, paste fenced JSON, paste a duplicate surface, paste an empty reply.

### Engine (Part B)

- Unit tests: readiness gates, rating mapping, absence cap, template bridge for user items.
- Integration: complete unit → ability unlock; stash → session → facet due change.
- Import: sample JSON/TSV golden files, plus a fenced tutor-pack reply and a duplicate-surface case.
- Brief builder: fixture profile yields a note with goal, abilities, known surfaces, and no FSRS words.
- Persistence: reload mid-session; reload after stash.
- Time travel: advance clock → comeback session composition includes user items when due.

---

## Phase 1 milestone checklist

| Milestone | Part | Done when |
|---|---|---|
| M1 Shell & tokens | A | Nav + Home composition approved; atmospheres + Lucide |
| M2 Session UX slice | A | Fixture unit playable on grid path |
| M3 Celebrations & soft fail | A | Sunburst/crown clear + soft failure feel right |
| M3b Stash & packs UI | A | Stash sheet + import mock demoable |
| M3c Tutor pack UI | A | Copy brief + paste preview demoable on Stash |
| M4 Schema & seed | B | Data survives reload |
| M4b Stash engine | B | User/import items + template bridges live |
| M4c Tutor pack engine | B | Brief from live progress; pasted pack persists like import |
| M5 Orchestrator live | B | Home Start is engine-driven (seed + interleave) |
| M6 Offline PWA | B | Full loop + stash/import without network |
| M7 Phase 1 freeze | A+B | Vertical slice + stash + tutor pack demoable on phone |

---

## Handoff to Phase 2

Phase 1 leaves explicit extension points:

1. **Boss Challenge** activity slot expecting a conversation provider interface.
2. **LearningSignal** table ready for AI corrections (and already used for manual/import sources).
3. **Write It** activity shell ready for stroke engine.
4. **Guide / AI context object** shape drafted (level, unit, targets, weaknesses, **stashed targets**) even if unused.
5. Facet `contextualUse` mostly idle until live conversation exists.
6. User-stashed phrases — including tutor packs — become natural Boss Challenge targets once AI is live.
7. Playfulness tokens/components reused — Phase 2 must not introduce a flatter “tools” aesthetic for writing/AI screens.
8. **Tutor pack stays the slow path.** Phase 2’s live proxy does not replace “Copy the brief / Bring the pack back.” In-session conversation and between-session curriculum growth remain different jobs.

Do not start Deno/Groq work until M7 is demoable.
