# Phase 2 — Production, Writing & AI Communication

**Goal:** Extend the Phase 1 journey into **real production** — script writing with deterministic validation, voice where the device allows, and a curriculum-aware AI conversation layer that appears as **Boss Challenge / Use**, not as a separate “AI Tutor” app. Corrections become future retrieval fuel.

**Maps to original plan:** Phases 3–6 (Writing Engine, AI Tutor, Voice, Curriculum Integration), plus the playful Use-stage UX from the journey rewrite.

**Depends on:** Phase 1 M7 freeze (engine-driven session, facets, FSRS, Home Continue, offline core, **stash/import** if shipped).

**North star (unchanged):** Invisible pedagogy; play on the surface, rigor underneath.

**Playfulness:** Keep Phase 1 reference language (grid workshop, path adventure, guide, SoftChoice, sunburst/crown clears). Writing and Boss Challenge must **not** flatten into a utilitarian tool skin — see `.cursor/rules/playful-visual-language.mdc`. User-stashed phrases from Phase 1 are prime Boss Challenge targets.

---

## Phase outcomes

By the end of Phase 2 the app can:

1. Run **Write It** with see → trace → copy → recall → free write → use-in-phrase progression.
2. Validate handwriting with deterministic checks (count, order, geometry); optional recognition later.
3. Launch **Boss Challenge** as the Use stage when readiness says the learner is ready.
4. Route AI through a **Deno Deploy proxy** (Groq primary, Gemini fallback); never ship provider keys in the PWA.
5. Inject tutor context: level, unit, targets, recent mistakes, weak facets, characters in play.
6. Turn conversation errors into **LearningSignals** that influence future comebacks — not instant flashcard spam.
7. Use Web Speech (and optional Whisper) for Say It / listening loops where supported.
8. Degrade gracefully offline: writing + deterministic practice work; Boss Challenge explains it needs connection or falls back to scripted roleplay.
9. Celebrate meaningful use (“You used 8 expressions in conversation”) over tap XP.

**Out of scope for Phase 2:** multi-language expansion at scale, cloud sync/accounts, commercial SaaS backend, custom handwriting ML training, heavy gamification economy.

---

## Architecture snapshot (Phase 2)

```text
REACT PWA (Phase 1)
  ├─ Write It engine (canvas / pointer + stroke datasets)
  ├─ Speech (Web Speech API; optional Whisper via proxy)
  ├─ Boss Challenge UI (conversation)
  ├─ Session orchestrator (extended readiness for Use + writing facets)
  └─ Dexie (attempts, writingAttempts, conversations, signals)

                │ AI / Whisper only when online
                ▼
          Deno Deploy proxy
             ├─ rate limiting
             ├─ API-key protection
             ├─ Groq (primary)
             ├─ Gemini (fallback)
             └─ optional short cache / Whisper route
```

---

# Part A — Pure Frontend

*Ship all new learner-facing surfaces with mocks: fake stroke success, scripted Boss Challenge dialogue, simulated STT transcripts. No Deno, no provider keys, no live models required to demo UX.*

**Visual & icons:** Follow `.cursor/rules/playful-visual-language.mdc` — `lucide-react` only for UI icons; same grid/sunburst/thick-outline language as Phase 1. Writing and Boss Challenge screens stay playful workshop energy, not a separate “serious tools” aesthetic.

## A1. Writing journey UI (“Write It”)

### Learner-facing progression

```text
SEE        → show character + animation
TRACE      → follow strokes
COPY       → write with guides
RECALL     → write from memory (supported → unsupported)
RECOGNIZE  → pick among similar forms (optional beat)
USE        → read/write inside the unit phrase
```

Playful framing examples:

- “Watch It” / “Trace It” / “Copy It” / “From Memory” / “Find It” / “Use It in the wild”

### Screens & components

| Piece | Responsibility |
|---|---|
| `StrokePlayer` | Stroke-order animation playback |
| `TraceCanvas` | Guided tracing overlay |
| `FreeWriteCanvas` | Unguided pointer ink |
| `GuideToggle` | With / without guides (`Eye` / `EyeOff` Lucide) |
| `RadicalBreakdown` | e.g. 明 → 日 + 月 (fixture content) |
| `LookalikePicker` | Recognition among similar characters |
| `PhraseEmbed` | Character highlighted inside unit sentence |
| `WritingFeedbackSoft` | Soft fail / hint (`CircleHelp`, `Lightbulb`) matching Phase 1 tone |

### Fixture content (minimum)

- 1–3 characters tied to the Phase 1 unit (e.g. 日, 仕事’s 事 or 今 / 日 as appropriate to scope).
- Mock validation: succeed/fail buttons or naive shape check stub — enough to exercise soft failure UI.

### Bridging into the unit

Writing must not feel like calligraphy class:

- After free write success → show `明日` or unit phrase containing the character.
- Orchestrator UI: Write It appears when `writing` facet is due or when unit bridge plan says so — still fixture-driven in Part A.

### Acceptance

- Full see→…→use path playable with mocks.
- Failure soft; celebration only on meaningful clears (character unlocked for Use, not every stroke).
- Works with finger on mobile viewport; large hit targets.

---

## A2. Boss Challenge & conversation UI

### Placement rule (UX)

AI is **not** a nav destination. Entry points:

1. Natural end of unit bridge: “You just learned X — let’s use it.”
2. Home soft row: “1 conversation milestone” when orchestrator marks Use ready.
3. Practice only if orchestrator queues it — never a permanent “Chat” tab required.

### Screens

1. **Pre-challenge brief**  
   Targets listed in human language (“予約する · tomorrow · two people”).  
   Recommended CTA: “Why not!” / secondary “Maybe later.”
2. **Challenge stage**  
   Roleplay scenario card (restaurant reservation, talking about today, etc.).  
   Chat transcript + composer (text first; mic button present even if mocked).
3. **Soft correction card**  
   Not ❌ Wrong — “Almost!” + short why + expected form.  
   Learner continues conversation.
4. **Challenge clear**  
   Celebratory screen: expressions used, crown / All Clear variant, ability progress tick.
5. **Offline / unavailable**  
   Friendly locked state + scripted fallback roleplay option (frontend mock of fallback).

### Guide personality

- Same guide component as Phase 1; Boss Challenge is the guide “entering the scene,” not a different product.
- Game-show energy in briefs; clarity in corrections.

### Scripted mock provider

Implement a `ConversationProvider` interface with a `MockConversationProvider`:

- Returns canned turns that deliberately reuse target vocab.
- Emits fake `CorrectionEvent`s for UI wiring.
- Simulates latency.

### Acceptance

- Happy path: brief → 4–6 turns → correction → recovery → clear.
- Learner can postpone challenge without breaking unit completion rules (define: unit can complete with Use deferred).
- No provider network calls in Part A.

---

## A3. Voice UI (Say It / Listen)

### Frontend-only

- Mic permission gate with clear explanation.
- Listening pulse / waveform cosmetic.
- Partial transcript display.
- “Heard you say…” confirmation before scoring (mock).
- TTS play buttons on Meet It / Break It Down / corrections (browser TTS mock OK).
- Unsupported-browser fallback: type instead, with honest copy.

### Acceptance

- Say It flow usable typed **or** with mocked STT.
- UI does not assume mic always exists.

---

## A4. Extended Progress & rewards UI

### Additions

- Writing milestones on Progress (“Characters you can write”).
- Conversation milestones (“Used past tense in a real exchange”).
- Skill constellation / RPG-inspired view can deepen: Destruction-style **independent** levels for Recognition / Production / Writing / Use — labels in learner language, numbers optional.
- Reward copy tied to use: “You successfully used 8 expressions in conversation.”

### Still avoid

- XP for each corrected character stroke.
- Streak punishment after a missed Boss Challenge.

### Acceptance

- Progress remains ability-first; new milestones plug into “I can…” narrative.

---

## A5. Orchestrator UX extensions (still mocked)

UI states for:

- **Ready for Boss Challenge** vs **Need more exposure**
- **Writing due** soft Home row
- **Welcome back** including “light conversation” offer vs warm-up only
- Session timeline showing Write It / Say It / Boss Challenge as path nodes

### Part A exit criteria

- [ ] Write It full UI progression with fixtures
- [ ] Boss Challenge full UI with MockConversationProvider
- [ ] Soft correction + challenge clear celebrations (`Crown` / All Clear visual language)
- [ ] Say It / Listen UI with typed + mock mic paths (Lucide `Mic`, `Volume2`)
- [ ] Offline Boss Challenge fallback screen
- [ ] Progress milestones for writing + conversation
- [ ] Lucide + playful visual rule applied (no emoji-primary chrome)
- [ ] Demoable on phone without Deno

---

# Part B — Backend / Service Integration

*Connect Part A to real local writing validation, live AI proxy, optional Whisper, speech APIs, and curriculum-aware scheduling signals.*

## B1. Writing engine (on-device “backend”)

### Deliverables

| Piece | Approach (from plan) |
|---|---|
| Stroke data | Hanzi Writer datasets / equivalent open stroke data |
| Input | Canvas or pointer events |
| Validation | Deterministic pipeline before any ML |

### Validation pipeline (order matters)

1. **Stroke count** — expected vs actual  
2. **Stroke sequence** — order match  
3. **Geometry** — start/end, angles, bounds, intersections, shape similarity  
4. **Optional recognition** — platform handwriting recognition if available (enhancement only)

Persist:

```text
WritingAttempt
  id, characterId, mode (trace|copy|free), strokeCountOk, sequenceOk,
  geometryScore, outcome, rawStrokes JSON, createdAt, sessionId?
```

Update `ItemFacet` where `facet = writing` (and recognition when Lookalike succeeds) via the same FSRS adapter as Phase 1.

### Script-specific adapters (Phase 2 scope)

- Ship **one** adapter thoroughly for the first language’s primary script needs (e.g. Japanese: kana + kanji path).
- Interface:

```text
WritingSystemAdapter
  getStrokeData(char)
  validate(attempt)
  progressiveModes()
  rtl? positionalForms?  // stub hooks for later scripts
```

Do not block Phase 2 on Arabic/Hangul/etc.; keep adapter boundary clean for Phase 7-style expansion later.

### Acceptance

- Trace / free write produce persisted attempts.
- Failures affect writing facet schedule.
- Character use-in-phrase step can mark contextual linkage in unit progress.
- Works offline.

---

## B2. AI proxy (Deno Deploy)

### Responsibilities

- Hold Groq / Gemini secrets in env — **never** in the PWA.
- CORS for the PWA origin(s).
- Personal-use rate limiting.
- Normalize provider responses to one JSON schema.
- Groq-first; automatic Gemini fallback on failure / rate limit.
- Optional short-lived cache (Deno KV) for identical non-chat helper calls.
- Optional Whisper (or speech) route if used.

### Suggested endpoints

| Endpoint | Purpose |
|---|---|
| `POST /v1/chat` | Boss Challenge turns |
| `POST /v1/health` | Provider availability |
| `POST /v1/transcribe` | Optional Whisper |
| `GET /v1/version` | Deploy sanity |

### Normalized chat response (sketch)

```json
{
  "assistantMessage": "明日の7時に二人で予約できますか？",
  "displayLanguageNote": null,
  "corrections": [
    {
      "span": "見ます",
      "expected": "見ました",
      "explanation": "Yesterday needs past tense.",
      "grammarTag": "past_tense",
      "severity": ["昨日"]
    }
  ],
  "targetsUsed": ["予約", "明日", "二人"],
  "suggestedFollowUp": true
}
```

### Acceptance

- PWA works with only the proxy base URL in env.
- Key leak test: repo + built assets contain no provider secrets.
- Kill Groq → fallback path returns usable turn.
- Rate limit returns friendly error the UI already designed in Part A.

---

## B3. Curriculum-aware conversation provider

### Replace mock with `LiveConversationProvider`

Context payload sent each turn (or session start):

```text
TutorContext
  learnerLevel
  targetLanguage
  unitId / unitSummary
  targetItems[]        // surfaces + glosses
  recentGrammarTags[]
  weakFacets[]         // item + facet + hint
  recentMistakes[]     // from LearningSignal
  charactersInFocus[]
  difficultyPreference
  scenarioId           // reservation, daily plans, …
```

### Retrieval-oriented behavior (system prompt rules)

- Prefer reusing target items; do not flood new vocab.
- Ask follow-ups that force retrieval of the same set.
- Correct gently; keep conversation moving.
- Mostly target language; brief L1 only for grammar explanation when needed.
- Stay inside scenario + level.

### Scenario library (content)

Author a handful of Boss Challenge scenarios tied to early abilities:

- Talk about today / work  
- Order food  
- Make a simple reservation  
- Talk about yesterday (past tense trap)

Each scenario declares **required targets** and **success criteria** (e.g. learner produced pattern X at least once).

### Acceptance

- Challenge for unit A reliably elicits unit A vocabulary.
- Correction objects parse into UI soft cards.
- Session can complete with measurable “expressions used” count.

---

## B4. Corrections → learning loop

### Policy (answers original open questions #6–#7)

1. On correction event → write `LearningSignal` (grammar tag, incorrect, expected, context).
2. **Do not** immediately enqueue a flashcard spam item.
3. Orchestrator later:
   - Prefer natural comeback prompts / AI follow-ups using the same tag.
   - If learner fails again on the same tag → strengthen signal → allow explicit recall/produce activity.
4. Repeated success → decay signal / mark resolved.

```text
Conversation → mistake → soft correction → LearningSignal
    → future retrieval (comeback or next Boss turn)
    → success → reinforce
    → fail again → stronger review candidate
```

### Data

Extend Phase 1:

```text
Conversation
  id, sessionId, scenarioId, unitId, startedAt, endedAt, status

ConversationTurn
  id, conversationId, role, text, createdAt, meta JSON

LearningSignal  (enrich)
  grammarTag?, incorrect?, expected?, conversationTurnId?,
  strength, status (open|resolved)
```

### Acceptance

- Induced past-tense error creates signal visible in debug drawer.
- Next orchestrated session includes a retrieval opportunity for that tag without dumping a “37 cards” UI.
- Second failure increases strength; success resolves or weakens.

---

## B5. Voice integration

### On-device first

- **TTS:** Web Speech API for Meet It, corrections, AI lines (when returned as text).
- **STT:** Web Speech API into Say It / Boss Challenge composer where supported.

### Optional proxy Whisper

- Use when browser STT missing or quality insufficient.
- Same Deno key protection / rate limits.
- UI already has typed fallback from Part A.

### Pronunciation workflow (v1)

- Lightweight: compare transcript loosely to target (normalized strings); soft feedback.
- Do not block Phase 2 on studio-grade pronunciation scoring.

### Acceptance

- At least one mobile browser path works for TTS + either STT or typed fallback.
- Whisper path documented as optional; app usable without it.

---

## B6. Orchestrator upgrades

### New readiness gates

```text
Produce success stable?
  → No  → more Build It / Say It
  → Yes → Boss Challenge eligible

Writing facet due + unit contains character?
  → insert Write It bridge before or after recall (content-defined)

contextualUse facet
  → updated from Boss Challenge outcomes
```

### Home language

| Engine | UI |
|---|---|
| Use eligible | “1 conversation milestone” / “Boss Challenge ready” |
| Writing due | “3 characters to practice” |
| Open grammar signals | Fold into comeback / challenge — not a raw error list |

### Offline behavior

- Writing + FSRS + journey: full.
- Boss Challenge: detect `/v1/health` fail → scripted fallback provider **or** postpone with momentum-preserving copy.
- Never corrupt local schedules because AI is down.

### Acceptance

- End-to-end online: unit → Write It → Say It → Boss Challenge → signals → next-day comeback.
- End-to-end offline: unit + writing; challenge deferred cleanly.

---

## B7. Security, cost, ops

| Concern | Approach |
|---|---|
| API keys | Deno env only |
| Cost | Free-tier Groq + Gemini fallback; personal rate limits |
| Privacy | Conversations stored locally; proxy may log minimally — document retention |
| PWA config | Proxy URL via build env |
| Failure | Friendly UI; Gemini fallback; local continue |

### Acceptance

- Cost strategy doc updated with real endpoint usage estimate for personal daily use.
- No auth/Supabase introduced unless a new requirement appears (out of scope).

---

## Part B exit criteria

- [ ] Writing adapter + deterministic validation persisted
- [ ] Writing facets scheduled via FSRS
- [ ] Deno proxy deployed with Groq + Gemini fallback
- [ ] LiveConversationProvider + TutorContext wiring
- [ ] Soft corrections → LearningSignals → future retrieval
- [ ] TTS + STT or typed fallback on target device
- [ ] Optional Whisper route (or explicitly deferred with issue note)
- [ ] Orchestrator gates Use + writing
- [ ] Offline degradation verified
- [ ] Part A mocks swappable via provider interfaces

---

## Phase 2 testing plan

### Frontend (Part A)

- Write It walkthrough on device (finger tracing).
- Boss Challenge script including correction + clear.
- Mic-denied path.
- Offline challenge fallback UI.

### Integration (Part B)

- Proxy contract tests (mock providers upstream).
- Fallback when primary 429/5xx.
- Correction JSON → signal → orchestrator inclusion.
- Writing validation golden strokes (pass/fail fixtures).
- Airplane mode: writing yes, live chat no.
- Prompt injection / off-rail: tutor stays on scenario (manual eval set).

### Learning quality (manual)

- Does Boss Challenge reuse targets?
- Does a mistaken 見ます reappear naturally later?
- Are celebrations tied to use, not stroke spam?

---

## Phase 2 milestone checklist

| Milestone | Part | Done when |
|---|---|---|
| M1 Write It UI | A | See→Use fixture path polished |
| M2 Boss Challenge UI | A | Mock roleplay + soft corrections |
| M3 Voice UI | A | Say It typed + mock mic |
| M4 Stroke engine | B | Deterministic validation + DB |
| M5 Deno proxy | B | Chat health + Groq/Gemini |
| M6 Live tutor | B | Context-aware Boss Challenge |
| M7 Signal loop | B | Corrections affect future sessions |
| M8 Speech live | B | TTS + STT/Whisper/fallback on device |
| M9 Phase 2 freeze | A+B | Online demo + offline degradation demo |

---

## Explicit non-goals (remain later)

- Full multi-script expansion (Arabic positional forms, Hangul blocks, etc.) — adapter hooks only.
- Cloud sync / accounts.
- Training a custom handwriting model.
- Replacing FSRS with a black-box model.
- AI as a free-chat destination unrelated to curriculum.

---

## Handoff beyond Phase 2

When M9 is done, natural follow-ons are:

1. More abilities/units authored with bridge plans + scenarios.
2. Additional `WritingSystemAdapter`s.
3. Richer pronunciation scoring if needed.
4. Streaming chat UX.
5. Only if required: sync layer — still resist until personal single-device use hurts.

Phase 2 success looks like: **the same Continue button** from Phase 1 sometimes leads into writing and Boss Challenges, pedagogy stays invisible, and the playful surface still sits on a rigorous local engine plus a thin AI proxy.
