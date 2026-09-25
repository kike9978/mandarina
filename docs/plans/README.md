# Mandarina plans

The running app followed Phase 1. The next pass is the redesign plan: flows the learner can trust, and a session that only counts a real retrieval. Phase 1 and Phase 2 stay the build plans. Each is split into **Part A — Pure Frontend** (fixtures/mocks) and **Part B — Backend / local-or-proxy integration**.

| Plan | Focus | Backend meaning |
|---|---|---|
| [Redesign — Clear flows & a real learning result](./redesign-flow-and-proficiency.md) | Same first lesson in all six languages; the learner can leave a language and come back; another language is a journey from Mandarina’s prompt, in the premade unit shape; journal and coach stay on device; success is logged only on retrieval | Same local stack. No model call from the app. The learner copies the prompt Mandarina wrote and pastes journey JSON back |
| [Phase 1 — Foundation & Learning Journey](./phase-1-foundation-and-learning-journey.md) | PWA shell, playful journey UX, session bridges, invisible FSRS, **stash/import**, **tutor pack** (brief out, JSON back), **listening posts** on the Journey map | On-device: Dexie, ts-fsrs, orchestrator, offline PWA, local dictionary. No in-app model calls or media players |
| [Phase 2 — Production, Writing & AI](./phase-2-production-writing-and-ai.md) | Write It, Boss Challenge, voice, corrections→signals | Stroke engine + Deno proxy (Groq/Gemini), speech |

**UI rules:** [`.cursor/rules/playful-visual-language.mdc`](../../.cursor/rules/playful-visual-language.mdc) — Lucide icons + Game Builder Garage / lesson-map playfulness (grid, path, guide, sunburst/crown clears, SoftChoice energy). Skyrim-style constellations only on Progress.

**Order:** Redesign phases in [redesign-flow-and-proficiency.md](./redesign-flow-and-proficiency.md). Check a box only when that behavior is in the running app. R1 language parity, then R2 honest path, R3 real grades, R4 honest claims, then R5 clipboard coach and R6 journal. R7 lets them switch languages, and adds one only when Mandarina’s journey prompt comes back as the premade unit JSON. Stroke order shows the strokes of a non-Latin mark and passes a trace only when the ink is that character. The old Phase 2 proxy and live talk wait until R1–R4 are done for all six languages. The app still does not call a model. The first lesson does not ship for Indonesian or Spanish alone.
