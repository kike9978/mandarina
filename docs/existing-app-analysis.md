# Mandarina — existing-app analysis (UX + language-learning)

Phase 0 only. Observation is separated from inference. No redesign, no fixes, no roadmap.

---

### 1. Executive Summary

Mandarina is a local-first, English-UI PWA for one learner per browser. There is no account, server, paywall, or product analytics. State lives in IndexedDB (Dexie). The intended loop is onboarding, a Home “continue” hero, one phrase session (Meet → Spot → Break down → Your Turn → Build → Say → optional Boss), a script warm-up, a stash the learner fills by hand or by pasting JSON, and optional listening posts the learner also fills by paste.

What ships is that loop around **one seed sentence** — “I have work today” — for Japanese, Indonesian, and Spanish only. Mandarin, Korean, and Arabic have a five-glyph script list and no phrase unit. The script session drills **glyph index 0 only** (`src/pages/ScriptSessionPage.tsx` lines 39–40). Goal choice is stored and copied into tutor briefs; it does not select lessons (`src/data/fixtures.ts` `PHRASE_UNITS`; `goalId` is read in `tutorSnapshot.ts` and listening/stash briefs, not in `decideDailyPlan`).

Completing the only phrase unit sets ability `talk-today` to `done` and increments `journeyDay`, then Home offers the same unit again (`src/state/AppState.tsx` `advanceFrom`, lines 649–669; `src/pages/HomePage.tsx` lines 114–147). Progress “Level” is `done ability count + 1`, not a proficiency scale (`src/pages/ProgressPage.tsx` line 24).

**Learning-critical findings**

1. Curriculum does not progress past one sentence. Four of six ability cards (“Introduce yourself”, “Order food”, “Make appointments”, plus a second script card) have no lesson.
2. For non-Latin languages, script familiarity `"new"` never unlocks the phrase hero. `scriptFamiliarity` is written once at onboarding and never updated after the warm-up (`HomePage.tsx` lines 43–45; `AppState.tsx` lines 394–403, 706–742).
3. Several steps log FSRS `Rating.Good` with no retrieval demand (Meet, Hear, phrase Spot, script Use). Production can be satisfied by a mock microphone that types the target (`src/learning/speech.ts` `runMockListen`).
4. Your Turn asks the meaning of the “work” word but rates the first item, which is “today” (`SessionPage.tsx` `YourTurn`, `focusId = unit.items[0]`).
5. The seed sentence answers an existence/possession question. The Boss scene asks “What are you doing today?” — a different speech act (`conversation.ts` lines 70–71 vs fixture glosses).

**Confidence:** high on code behavior; low on felt drop-off, TTS quality, and measured accessibility. Those were not observed in a browser.

---

### 2. Scope & Method

**Inspected**

- Routes and shell: `src/App.tsx`, `src/components/AppShell.tsx`, `src/components/DeviceStage.tsx`
- Persistence: `src/state/AppState.tsx`, `src/db/mandarinaDb.ts`, `src/db/types.ts`, `src/db/seed.ts`
- Pages: onboarding, home, journey, practice, progress, stash, phrase session, script session, both clear screens
- Learning: orchestrator, FSRS adapter, attempts, template bridge, speech, writing, conversation, TTS, tutor snapshot
- Content: `src/data/fixtures.ts`, `src/data/languages.ts`
- Session UI: boss, mic, listening post, session bits, write canvas
- Tests: seven `src/learning/*.test.ts` files (node/vitest; no component or browser tests)
- Config: `package.json`, `README.md` (still the Vite template README)

Product plans under `docs/plans/` were not scored. They describe intent, not the running client.

**Not inspected**

- A running browser click-through
- Real users, analytics, or hosting
- Device TTS voice quality, Web Speech accuracy, YouTube embed behavior
- Contrast measured with a tool
- A numeric FSRS simulation (intervals below are directional from the rating map, not a replay of `ts-fsrs`)

**Assumptions**

- “Existing add” means this app.
- The implied learner reads English. Glosses, decoys, and chrome are English.
- Stage is a local prototype (`version` `0.0.0`, `private: true`).
- One profile id: `"local"`.

---

### 3. Learner Model

#### Archetypes

| Archetype | Implied by | What the build actually optimizes |
|---|---|---|
| **A. English-literate adult, zero target language, phone, ~15 min, “daily life”** | Default name “Traveler”, default language Indonesian, default script `"new"`, default goal `daily` (`OnboardingPage.tsx` lines 21–25). Copy promises phrases after a light warm-up. | **Primary.** Latin-script languages (Indonesian, Spanish) get the phrase hero immediately even when script is `"new"`, because `phraseReady` is true for all `latin-sounds` (`HomePage.tsx` lines 43–45). |
| **B. English-literate adult, new to a non-Latin script (Japanese, Mandarin, Korean, Arabic)** | Onboarding copy: “start me from the marks” then “then phrases” (`OnboardingPage.tsx` lines 205–206; `languages.ts` lines 127–132). | **Partially.** Warm-up exists. Phrase content exists only for Japanese, and `"new"` never flips `phraseReady`. Mandarin, Korean, and Arabic never get a sentence. |
| **C. Traveler / worker / media fan who already chose a goal** | Four goals (`languages.ts` lines 149–154). Confirm screen says the goal “steers today’s path” (`OnboardingPage.tsx` lines 154–155). | **Unserved in the lesson.** The only sentence is work-today. Travel, work/school, and media do not change units, decoys, or the Boss scene. Goal text appears in exported tutor briefs only. |
| **D. Self-directed learner who brings their own phrases or a video** | Stash, dictionary subset, JSON pack paste, listening posts. | **Secondary, manual.** Nothing is fetched. The learner must paste JSON or type. Sample packs are Indonesian regardless of the chosen language (`fixtures.ts` `SAMPLE_TUTOR_PACK_JSON`). |

**Inference:** the product copy addresses A and B. The code path that completes is A on Indonesian or Spanish. B with `"new"` and C’s non-daily goals are stated and then not served by content selection.

#### Jobs-to-be-done

| Job | Served? | Evidence |
|---|---|---|
| Say one daily-life sentence after a guided path | Partially, for ja/id/es, and for ja only if script ≠ `"new"` | One `PhraseUnit` per those languages |
| Learn the writing system from zero | Partially, one glyph | `glyphs[0]` only; five glyphs defined, four unused in the session |
| Reach a stated goal (travel, work, fun) | Stated, unserved | `goalId` not an input to `decideDailyPlan` or `PHRASE_UNITS` |
| Introduce yourself, order food, make appointments | Stated, unserved | Ability titles in `buildAbilities` (`fixtures.ts` lines 282–307); status stays `locked`; no units |
| Review on a schedule | Mechanism exists, learner-invisible | `ts-fsrs`; Home copy never says “due” (`orchestrator.ts` lines 1–18) |
| Practice from something the learner cares about | Only if they paste or type it | Stash / listening import |

#### Prior knowledge assumptions

| Assumption | Measured? |
|---|---|
| English literacy for all instructions, glosses, and decoys | Assumed. No L1 choice. |
| Latin alphabet already known for Indonesian and Spanish | Assumed in copy (`OnboardingPage.tsx` lines 57–60). |
| Script familiarity is a 3-way self-report | Collected once. Not tested. Not updated after the warm-up. |
| Target-language level is beginner | Assumed. No placement item beyond the self-report. |
| Learner can type the target script | Assumed at Say It (textarea). No IME help. |
| Microphone is optional | Explicit. If permission is not already `granted`, mock listen runs (`speech.ts` `canUseLiveSpeech`; `MicListen.tsx` lines 74–78). |

#### Affective profile

Copy aims low-threat: “no quiz yet”, “Why not! / Nah…”, skip on Boss, soft fail copy, no XP, no streak punishment (visual-language rule and `SoftFeedback`). Guide is a named fruit character (`guideName` per language). Default display name is “Traveler”, not the learner’s identity in the L2.

**Raises the affective filter (inference from mechanics):** mock mic that speaks for the learner can feel like a win that isn’t theirs; exact-match Say It fails near-misses with the same hint string; Boss correction is one fixed line (“Almost — say it the way we practiced”). **Lowers it:** skip, reveal, no public score, offline-local privacy copy on the mic gate.

Identity target is “sound like the textbook sentence,” not “sound like yourself.” Boss success is substring presence of the drilled line (`conversation.ts` `usedTarget`).

---

### 4. Motivational & Affective Journey

Felt path for archetype A (Indonesian, script `"new"`, goal daily). Times are the fixture’s own estimates, not observed session lengths.

| Phase | What the learner meets | Felt state | SDT |
|---|---|---|---|
| First contact | “What language are we learning?” Guide promises no forced script bootcamp. | Curiosity. Four steps before any L2. | Autonomy: language, script, goal, name. Relatedness: named guide. Competence: none yet. |
| Confirm | “Ready for some thrilling interactive lessons?” | Expectation is set high relative to one sentence. | — |
| Home | “You're learning to say what you're doing today.” CTA “Start”. ~16 min · 7 activities. | Clear next step. | Competence promised, not yet shown. |
| Meet It | Full sentence + gloss on screen. Audio is optional. CTA always works. | Low threat. Also low demand. “Got it” is available without listening. | Competence is declared by the button, not earned. |
| Spot It | Two chips, both correct. No decoy. | First “win” with no way to be wrong. | Competence inflated. |
| Break It Down | All glosses listed. No check. | Dead zone: read and tap through. | — |
| Your Turn | 3-choice meaning. Decoys “friend” / “tomorrow” are distant. | Real but easy retrieval. Fail path exists. | First genuine competence check. |
| Build It | Chunk order. Check only appears when all chunks are placed and the order is wrong. Correct order skips “Check” and shows success immediately (`SessionPage.tsx` lines 631–670). | A real production step, then an immediate win if the order matches. | Desirable difficulty only on the error path. |
| Say It | Type or mic. Mock mic fills the answer. | Peak if they produce it; hollow if the mock does. | Autonomy (type vs mic) vs fake competence (mock). |
| Boss | Optional. Scene asks what they’re doing. Skip is “Nah…”. | Relatedness attempt (classmate). Skip removes the only communicative use. | Relatedness is scripted and one-shot. |
| Clear | Celebration, then Home. | Peak, then the same lesson is the next CTA. | Competence (“I can say this”) has nowhere to transfer. |
| Return | `journeyDay` increments. No notification. Second session is the same sentence, possibly with a comeback MCQ if a reviewed card is due. | Plateau. Probable abandonment after the celebration has no new job. | Autonomy and relatedness do not grow. Cue for day 2 is absent unless the learner opens the app. |

**Dead zones:** Break It Down (exposure only); script Use It (read a gloss, tap clear); Home after the only unit is done (same hero).

**Emotional trough specific to archetype B, Japanese, script `"new"`:** onboarding says phrases come after the marks (`OnboardingPage.tsx` lines 205–206). After the warm-up, Home still has no phrase hero (`phraseReady` stays false). Guide says “then we bridge into real phrases” (`HomePage.tsx` lines 175–176). The bridge does not occur. Inference: this is the sharpest trust break in the product.

---

### 5. Current State Map

#### Routes (`src/App.tsx`)

| Route | Screen | Nav |
|---|---|---|
| `/welcome` | Onboarding: language → script → goal + name → confirm | Hidden |
| `/` | Home | Tab |
| `/journey` | Path map + listening posts | Tab |
| `/practice` | Practice launcher | Tab |
| `/progress` | “I can…” + level | Tab |
| `/stash` | Stash, dictionary, pack import, tutor brief | Linked, not a tab |
| `/session` | Phrase / stash / listen / boss | Hidden |
| `/clear` | Phrase celebration | Hidden |
| `/script` | Script session | Hidden |
| `/script-clear` | Script celebration | Hidden |

Unknown paths redirect to `/`. Unonboarded users go to `/welcome`. Loading copy: “Warming up Mandarina…”.

**Absent:** settings, account, language switch, notifications, paywall, support.

#### Data (Dexie, `src/db/types.ts`)

`profiles`, `abilities`, `items`, `fsrsCards`, `sessions`, `attempts`, `signals`, `stash`, `listeningSources`, `contentPacks`, `settings`. Profile id `"local"`. Facets: `recognition`, `listening`, `production`, `writing`, `contextualUse`.

#### Content counts

- Languages: 6. Phrase units: 3 (ja, id, es). Script glyph lists: 5 per language. Glyphs actually drilled per session: 1.
- Seed dictionary: 8 Japanese entries (`DICTIONARY_SUBSET`).
- Ability cards per language: 6. Cards with a playable unit: 1 (`talk-today`) plus a script warm-up that is not a full track.
- Phrase activities in `SESSION_STEPS`: 7, plus `clear`. Comeback inserts one extra step when due rows exist.

#### Integrations

Browser `speechSynthesis` (rate 0.92). Web Speech only if the constructor exists **and** microphone permission is already `granted`. Otherwise mock. No cloud model. Listening “player” is a link or embed the learner supplies. Tutor loop is copy-out / paste-in JSON.

#### Analytics

None. Local tables can be queried in the debug drawer. No export to a warehouse.

---

### 6. User Journey Map (functional)

1. **Welcome.** Pick language (default Indonesian). Script resets to `"new"` on each language tap (`OnboardingPage.tsx` lines 67–69).
2. **Script self-report.** Three options. Not validated.
3. **Goal + name.** Copy: “This steers today’s path.” Stored only.
4. **Confirm.** “Why not!” writes the profile and seeds abilities.
5. **Home.** `decideDailyPlan`:
   - Non-Latin `"new"` or `"some"` and script not done → script route.
   - Latin `"new"` does **not** block phrases (`scriptOptional: true`).
   - Absence > 5 days and due cards → “Ease back in”.
   - Due cards and `phraseReady` → comeback woven into the same unit.
   - No phrase and stash exists → stash.
   - Else if phrase ready → same unit.
   - Else “Practice sounds”.
6. **Phrase session** or **script session** or **stash**.
7. **Clear** increments `journeyDay` by 1 per completion, not per calendar day (`advanceFrom` lines 663–669). Two clears on the same day make “2 day journey”.
8. **Return.** No push, no email, no calendar. Next open shows the same hero.

**Copy vs behavior**

| Copy | Behavior |
|---|---|
| Goal “steers today’s path” | Goal is not an input to the planner |
| New-script learners get phrases after the warm-up | `scriptFamiliarity` stays `"new"`; `phraseReady` stays false for ja/zh/ko/ar |
| “Spot It among friends” / find the glyph | Script Spot shows the target glyph in the prompt (`Find あ`) and in the choices |
| “Try saying it” | Mock listen writes `target` into the field (`speech.ts` lines 78–92) |
| “checkpoint cleared” still offers Start on the same unit | `talk-today` done does not swap the unit |
| Level on Progress | Count of `done` abilities + 1 |

**Drop-off risks (inference, not measured):** four onboarding screens before L2; Meet/Spot wins that don’t feel earned; Boss skip; post-clear sameness; archetype B stuck on script after being promised phrases.

**Dead ends:** locked ability cards; Mandarin/Korean/Arabic phrase absence; dictionary is Japanese-only even when the profile language is not Japanese.

---

### 7. Core Learning Loop Analysis

**Trigger → lesson → feedback → progress → return**

- **Trigger:** learner opens the app. No external cue.
- **Lesson:** fixed activity order (`orchestrator.ts` `CORE_ORDER`).
- **Feedback:** correct tap, exact string match, ink length, or scripted chat. Hints are fixed strings.
- **Progress:** ability status, `journeyDay`, FSRS card due dates. UI shows day count and “I can…”, not stability.
- **Return:** none scheduled in the product. FSRS due dates affect the next open only if the learner returns and a reviewed card is due.

#### Retrieval demand (phrase path, happy path, no comeback)

| Step | Demand | Graded? | Rating if they continue |
|---|---|---|---|
| Meet It | Exposure. Audio optional. Gloss visible. | Yes, first item, facet `listening` | `success` → Good, even if Hear was never tapped |
| Spot It | Recognition of two chips that are both targets. No lure. | Yes, both, facet `recognition` | `success` |
| Break It Down | Exposure. Full gloss list. | No | — |
| Your Turn | Recognition (3-way meaning). | Yes, but on `items[0]`, not the prompted word | `success` / `fail` / `hint` / `reveal` |
| Build It | Cued production (chunk order). Chunks are the sentence itself. | Yes, `items[0]`, facet `production` | `success` if order matches |
| Say It | Production, but exact-match after stripping space and punctuation. Model was on screen two steps earlier; placeholder leaks the first tokens (`sentencePlaceholder`). | Yes, `items[0]`, facet `production` | `success` if string equals target, including mock transcript |
| Boss | Communicative use, optional. Match is loose (below). | `contextualUse` on `items[0]` | Forced `success` if `used` or outcome is success (`SessionPage.tsx` lines 133–142). Skip logs nothing. |

**Ratio, phrase happy path, counting a step once:** exposure 2 (Meet, Break), recognition-without-lure 1 (Spot), recognition-with-lures 1 (Your Turn), cued production 2 (Build, Say), optional communicative 1 (Boss). **Retrieval with a real chance of error: 3 of 7 steps (Your Turn, Build, Say).** If Boss is skipped: **3 of 6**. Meet and Spot are 2 of 7 steps that still write a successful review.

Script path, one glyph: See = exposure, ungraded. Hear = exposure graded as listening success (TTS speaks the **reading label**, e.g. `"a"`, not the glyph — `ScriptSessionPage.tsx` lines 208–209). Spot = recognition, but the prompt prints the target glyph. Match = recognition of the reading. Trace/Copy/Recall = motor production graded by ink length ≥ 70px and ≥ 1 stroke (`writing.ts` lines 22–30), three times, each a separate `success` on the same writing card if they pass. Use = exposure graded as `contextualUse` success.

#### Grading validity

- **Success without retrieval:** Meet, Hear, phrase Spot, script Use, and any Say success produced by `runMockListen`.
- **Failure without diagnostic value:** Say It and Build It share one hint each. Boss “fail” is “you didn’t include a chunk,” then one canned correction. Ink fail means “not enough pixels,” not a wrong stroke.
- **Wrong item:** Your Turn prompt is `turnPromptSurface` (work) while the card is `items[0]` (today) for all three seed units.

#### Loop closure

The clear screen can produce “I finished the path.” The transferable claim “I can say what I’m doing today” is only true for this one sentence, and the Boss question does not match the sentence’s speech act. **Return trigger: absent.** It is not intrinsic (no new job) and not scheduled (no notification).

---

### 8. Learning-Outcome Ledger

One complete **Japanese** phrase session, happy path, audio tapped once at Meet, Boss played and the target included, no comeback, no reveal. Items in the unit: 今日, 仕事, あります, 〜があります (4). Facets seeded per item: 5. Cards that receive a review on this path: **3 item-facet pairs**, all on 今日 (`items[0]`), plus recognition on 今日 and 仕事 from Spot.

| Item | Facet | Reps this session | What actually happened |
|---|---|---|---|
| 今日 | listening | 1 Good | Button “Got it”. Hearing the audio is not required. |
| 今日 | recognition | 1 Good (Spot) + 1 Good (Your Turn) | Spot cannot be wrong. Your Turn question was about 仕事. |
| 仕事 | recognition | 1 Good (Spot) | Same no-lure tap. The meaning question that *shows* 仕事 is not logged on 仕事. |
| あります | — | 0 | Gloss shown in Break only. |
| 〜があります | — | 0 | Gloss shown in Break only. |
| 今日 | production | up to 2 Good (Build and Say) | Both call `log` on `items[0]` only. The sentence is produced; the card credited is “today”. |
| 今日 | contextualUse | 1 Good if Boss “hits” | Loose match. |
| 仕事 / あります / pattern | listening, production, writing, contextualUse | 0 | Seeded empty. Writing facet of phrase items is never scheduled by this session. |

**Reps per facet per session (credited cards, not unique knowledge):** listening 1, recognition 3 (two items), production 2 (same item), contextualUse 0–1, writing 0. **Unique form–meaning mappings with a retrieval demand: 1** (the work-word MCQ), and it is stored on the wrong card.

**Retention this schedule is likely to produce:** one successful FSRS review does not create a 30-day memory. Default `ts-fsrs` with `enable_fuzz: false` (`fsrsAdapter.ts` line 13) maps `success` to `Rating.Good` and `hint`/`fail`/`reveal` to Hard or Again. A single Good on a new card schedules a short first interval. Items never reviewed (あります, the pattern, and every non-credited facet) stay at reps 0 and are excluded from comeback (`listDueFacets` requires `reps > 0`). **A learner who completes the app once and stops retains, at best, a fragile trace of one sentence and one or two word glosses, with the scheduler believing “today” was produced and understood.**

Script session ledger (Japanese, glyph あ only), if they pass trace, copy, and recall: listening 1 Good (Hear), recognition 2 Good (Spot + Match), writing 3 Good on the same card, contextualUse 1 Good (Use, no retrieval). Glyphs い う え お: 0 reps.

---

### 9. Input / Output & Modality Balance

**Phrase curriculum (the only curriculum), counting the seed sentence once:**

| Modality | What the learner does | Share of the 7-step path |
|---|---|---|
| Reading | Sentence and glosses on every step | Present throughout. Dominant input channel. |
| Listening | Optional TTS. Not required to advance. | 0 required reps. |
| Writing (keyboard) | Say It textarea | 1 step, skippable via mock mic or reveal |
| Speaking | Mic if already permitted; otherwise mock that does not require speech | 0 required reps |
| Handwriting | Not in the phrase path | 0 |

**Input : output.** Input-only or no-error steps: Meet, Spot, Break (3). Output steps: Build, Say, optional Boss (2–3). Your Turn is receptive retrieval. Roughly **half the steps are input or pseudo-input**. Required spoken output: **0%**. Required listening: **0%**.

**Vs a beginner “say what you’re doing today” goal:** a meaning-focused speaking goal needs comprehensible input plus pushed output and some pronunciation feedback. This build is form-focused reading and chunk assembly of one sentence. Meaning-focused communication is the optional Boss, which is skippable and scripted.

**Silent period:** not a design. The learner is asked to produce (Build/Say) in the same session as first exposure. There is no listening-only stage that gates production.

**Pronunciation:** no model-vs-learner comparison. TTS plays the sentence or, on the script path, the romanization/reading string. STT transcript is exact-match against the written sentence, so accent, pitch accent, and tone are invisible.

**Meaning-focused vs form-focused:** Break and Your Turn are meaning. Build and Say are form (order and exact string). Boss is the only meaning-focused output, and it accepts a four-character prefix or any item surface of length ≥ 2 (`conversation.ts` lines 29–38).

---

### 10. Content & Curriculum Audit

#### Structure

One unit. No sequence, no difficulty curve across days. Estimated 16–18 minutes in the fixture (`estimatedMinutes`). Activity count 7. Script lists are five items but the session never advances the index.

Ability order implies a syllabus — script, lookalikes, introduce yourself, today, food, appointments — that does not exist as content. `intro` flips to `partial` when the script session clears (`advanceScriptFrom` lines 721–732) even though no introduction phrase was taught.

#### Naturalness (would a speaker say this here?)

| Language | Sentence | Register | Note |
|---|---|---|---|
| Japanese | 今日は仕事があります。 | Polite ます | Grammatical. Answers “is there work?” / “I have work” more than “what are you doing?”. Everyday speech more often uses 今日は仕事です or 今日仕事あります. |
| Indonesian | Hari ini saya ada kerja. | Casual | Understandable. More usual: *Hari ini saya kerja* or *Saya ada pekerjaan*. *Ada kerja* is awkward as a set phrase. |
| Spanish | Hoy tengo trabajo. | Neutral | The most natural of the three. Still answers possession (“I have a job / I have work”) more cleanly than “what are you doing today?” (*Hoy trabajo*). |

Boss NPC line is English: “Hey! What are you doing today?” (`conversation.ts` line 71). The learner is praised for a sentence that does not answer that question’s usual speech act.

#### Frequency and transfer

“Today” and “work/job” are high-frequency. The Japanese pattern 〜があります is useful and transferable (time, possessions, events). It is shown once and never retrieved as its own item. Indonesian and Spanish units do not isolate a reusable frame beyond the whole sentence. No second context (tomorrow, no work, a different object).

#### Pragmatics

Polite Japanese vs casual Indonesian vs neutral Spanish are not explained. Boss scene is “a classmate,” which fits ます-form reasonably and does not fit a workplace or a stranger. No honorific choice, no tu/usted, no Indonesian register switch (saya vs aku).

#### Authenticity

Seed lines are textbook-daily, not overheard speech. Sample listening transcript (“Jakarta itu panas sekali…”) is more authentic than the seed unit and is Indonesian even as a sample inside other languages. Dictionary entries (tomorrow, eat, drink, reservation, friend) are Japanese only.

#### Variety of communicative functions

In the seed path: one function — state that work exists today. Not covered despite ability titles: greeting, self-introduction, ordering, scheduling, asking, refusing, repairing breakdowns. Sample tutor JSON adds hunger and “what do you want to eat?” but only if the learner imports it.

#### CEFR

No CEFR, JLPT, HSK, or TOPIK tag in content or UI. One session, if the sentence were actually learned, is still pre-A1: a single memorized chunk, not A1 interaction.

#### Cultural / pragmatic errors

- Speech-act mismatch (doing vs having), all three languages.
- Indonesian collocation *ada kerja*.
- Script Hear plays the reading gloss through target-language TTS (`speakText(reading, ttsLangFor(...))`), so Japanese hears a voice say “a”, not あ.
- Spanish script hint “como baño” drops English learners into an unglossed Spanish word (`languages.ts` line 194).
- Korean 가 is taught as a syllable block while the other four items are jamo; the session only runs ㄱ.
- Arabic letters are isolated forms; joining is not shown. No `dir` handling found for Arabic phrase text (there is no Arabic phrase).
- Mandarin tone marks exist on readings; nothing checks tone.

---

### 11. Error & Feedback Taxonomy

| Error a learner can make | Detected? | Feedback | Adapts? |
|---|---|---|---|
| Wrong 3-way gloss (Your Turn, Comeback, Match) | Yes | Fixed hint + reveal of the pair | No. Hint does not depend on which decoy was chosen. |
| Wrong chunk order (Build) | Only after they tap Check. Correct order never needs Check. | “Put the chunks in the same order…” + full sentence | No partial credit. No “this chunk is in the wrong slot.” |
| Typed sentence not an exact normalized match | Yes, binary | “Rebuild from the chunks…” + full target | No. Missing particle, wrong word, extra word, and empty string are the same fail. |
| Spoken attempt | Only if live STT returns a transcript **and** it normalizes equal. Otherwise mock inserts the key. | Same as typing | No pronunciation diagnosis. |
| Ink too short | Yes (`inkLooksWritten`) | “A quick tap doesn’t count” | No stroke-order, shape, or character identity check. |
| Boss reply misses the chunk | Yes, once (`corrected` flag) | One canned “Almost” plus the full target sentence | Second miss is not corrected again; later turns can still end the scene (`conversation.ts` lines 97–102). |
| Skipped audio | No | — | Graded success anyway on Meet/Hear. |
| Wrong register, particle, word order inside a chunk, tone, pitch accent, gender, politeness | No | — | — |
| Tapping both Spot chips (the only chips) | Cannot be wrong | Success | — |

**Blind in principle:** pronunciation, Mandarin tone, Japanese pitch accent, Arabic phonemes, register, pragmatics, particle choice, agreement, word order beyond the provided chunks, handwriting identity, listening comprehension (no audio-only item), L1 interference.

`signals` rows are written on fail/reveal (`attempts.ts` lines 49–57) and are not read by the planner. Comeback is “what does this mean?” regardless of which facet was due (`ComebackIt` always shows gloss options).

---

### 12. Cognitive Load Per Screen

| Screen | Intrinsic | Extraneous | Germane | Load |
|---|---|---|---|---|
| Onboarding language | Low (6 labeled choices) | Guide paragraph plus native name plus writing-system subtitle | Choosing a language | Moderate, appropriate |
| Onboarding goal | Low | Copy claims the goal steers the path | Goal choice that is not used | Extraneous relative to later payoff |
| Home, phrase ready | Low | Day counter, minute estimate, guide, optional second CTA “tiny scene”, soft rows under the hero | One next action | Slightly overloaded chrome; one loud CTA matches the layout rule |
| Home, script `"new"` non-Latin | Low task | Promise of a phrase bridge that is not on the screen | — | Under-loaded as a lesson; overloaded as a broken expectation |
| Meet | Low | Gloss + sentence + optional audio + stash-unrelated CTA | Noticing form–meaning | Under-loaded |
| Spot | Very low | Stash button appears mid-task | — | Under-loaded. Two targets, zero lures. |
| Break | Medium (up to 4 gloss cards) | None severe | Could be the worked example | Under-loaded: no question |
| Your Turn | Low (3 distant decoys) | — | One meaning retrieval | Appropriate, easy |
| Build | Medium | “Check” only on the failure shape; success is silent assembly | Order reconstruction | Appropriate if they don’t already see the sentence in the placeholder later |
| Say | High if they must type Japanese | Placeholder leaks the opening (`今日は…` via `sentencePlaceholder`); mock transcript is the answer | Recall of the sentence | Extraneous when the answer is supplied |
| Boss brief | Medium | Target sentence listed before the chat (`BossChallenge.tsx` lines 101–109) | Task framing | The brief shows the answer, then the chat asks for it |
| Script Spot | Low | Prompt already prints the glyph to find | Visual discrimination | Extraneous: search key equals the target |
| Trace | Medium motor | Ghost glyph at 0.28 then 0.12 opacity | Form practice | Appropriate fading inside this one glyph |
| Stash / listening paste | High | JSON, TSV, briefs, sample packs, multiple textareas | None for language | Overloaded for a learner; this is an authoring console |

---

### 13. Scaffolding & Desirable Difficulty

**Fading inside one session**

- Phrase: full gloss (Meet, Break) → meaning MCQ → chunk order with chunks visible → exact sentence. Support drops, but the sentence remains available via reveal, placeholder, and mock mic.
- Script writing: ghost 0.28 → 0.12 → 0 (`ScriptSessionPage.tsx` `copy` map). That fade is real and local to one glyph. It does not continue to glyph 2 or to day 2.

**Fading across days:** none. Day 2 is the same unit. `journeyDay` does not select harder content.

**Bypasses that remove desirable difficulty**

- Reveal on Your Turn, Build, Say, Comeback, script Spot/Match/Trace advances the step and logs `reveal` → FSRS Again (`outcomeToRating`).
- Boss “Nah… skip” advances with no attempt (`onSkip`).
- Mock mic emits the target.
- `usedTarget` treats a 4-character prefix or any item substring (length ≥ 2) as a hit. For Japanese, 今日 (two characters) inside a longer reply counts.
- Phrase Spot cannot be failed.
- Script Spot prompt includes the glyph.
- Build It treats a correct order as done without a check, so the learner never has to commit before seeing success.

**Missing support**

- No spoken model required before Say It (Hear is optional and not on the Say screen, though Boss has a hear control).
- No partial credit for a near-miss sentence.
- No worked example of a *different* sentence using があります before production.
- Non-Latin `"new"` learners are not shown the phrase path after the scaffold that was supposed to precede it.

**Curve vs a pre-A1 target (description, not a proposal):** a pre-A1 curve would move from lots of input toward a small, supported utterance, then a second context. The current curve is flat after one sentence, with difficulty spikes that are optional or bypassable (Say, Boss) and a trough of ungraded exposure in the middle.

---

### 14. Personalization & Relevance

**Collected:** display name, language, script familiarity, goal, `journeyDay`, `lastActiveAt`, attempts, FSRS state, stash text, listening URLs, boss-clear count.

**Used to change the lesson**

| Signal | Effect |
|---|---|
| Language | Picks the one unit or the script glyph list. Switches guide name. |
| Script familiarity | Gates Home hero and whether script is forced. Never recomputed. |
| Goal | String in tutor/listen briefs only. |
| Due cards | Inserts up to 3 comeback MCQs; absence > 5 days changes Home headline (`ABSENCE_MS` in `orchestrator.ts`). |
| Stash | Can become the active unit (`buildUnitFromStash`, max 3). |
| Name | Greeting only. |
| Errors / facet due | Comeback ignores the due facet and always asks for the gloss. |
| Time of day, session length, modality preference | Not stored. Not used. |

**Promised and not delivered:** “This steers today’s path” (goal). “Then phrases” after a new-script warm-up. “We won’t force a foreign-script bootcamp unless you need one” is true for Latin; for Japanese `"some"` the script route is forced until the warm-up is cleared (`needsScriptFirst` includes `"some"`).

---

### 15. Assessment Validity

| Check | Claims to measure | Actually measures | Gameable? | Validity |
|---|---|---|---|---|
| Meet “Got it” | Listening success on item 0 | Button press | Yes, ignore audio | **Fail.** Exposure scored as listening. |
| Spot chips | Recognition of today + work | Willingness to tap both only-correct chips | Yes | **Fail.** No alternative. |
| Your Turn | Meaning of the prompted word | Meaning of the prompted word, **recorded on item 0** | Guess 1/3; reveal | **Fail** as a record. The item on screen and the item in FSRS differ. |
| Build | Production of the sentence | Order of given chunks | Reveal; chunks are a closed set, so chance is 1/n! (ja 6 orders, es 6, id 120) | **Weak.** Cued reconstruction, not free production. Logged on item 0. |
| Say | Speaking or writing the sentence | Exact normalized string equality | Mock mic; placeholder; reveal; paste | **Fail** for speaking. **Weak** for writing. |
| Ink | Writing the glyph | Path length ≥ 70 and ≥ 1 stroke | Scribble | **Fail** for orthographic accuracy. |
| Script Spot | Visual search | Pick the glyph already printed in the stem | Low | **Weak.** |
| Script Match | Grapheme–phoneme link | MCQ among readings | 1/n | **Moderate** for that one glyph, if decoys are real. |
| Script Use | Contextual use | Button press | Yes | **Fail.** |
| Boss | Use in a scene | Substring / 4-char prefix; skip logs nothing | Type the first word; skip | **Fail** for communicative competence. |
| Comeback | The due facet | Gloss MCQ with fixed English decoys | 1/3 | **Weak.** A due writing card is reviewed as a gloss tap. |
| Progress level | Proficiency | `done` cards + 1 | Clear the only unit | **Fail.** |
| `journeyDay` | Days on the path | Completions, not calendar days | Replay | **Fail** as a day count. |

---

### 16. Retention & Scheduling Projection

Scheduler: `ts-fsrs` `FSRS`, `generatorParameters({ enable_fuzz: false })`. `success` → Good, `hint` → Hard, `fail` and `reveal` → Again (`fsrsAdapter.ts` lines 17–28). Comebacks require `reps > 0` and cap at 3 unique items, preferring recognition over other facets (`FACET_PRIORITY`).

**Not simulated numerically in this pass.** Directional consequences:

| Horizon | What a one-session completer has | Likely retention |
|---|---|---|
| 1 day | One Good on a handful of cards, mostly item 0, plus ungraded exposure to the sentence | The sentence may still be recognizable because it was on screen many times. That is massed exposure, not a spaced review. |
| 7 days | No in-app cue to return. If they do not open the app, no further review occurs. | Forgetting of a single unrepeated chunk is the default expectation. FSRS will not have delivered a second review. |
| 30 days | Same, unless they returned on their own and comebacks fired | Unreviewed items (the pattern, あります, glyphs 2–5, three languages with no sentence) remain at zero reps. |

**Grades that corrupt the schedule**

- Meet and Hear: Good on `listening` without a listening response.
- Phrase Spot: Good on `recognition` without a lure.
- Script Use: Good on `contextualUse` without use.
- Mock Say: Good on `production` without production.
- Ink scribble: Good on `writing` without a correct glyph.
- Your Turn Good: written onto “today” after a question about “work,” so later comebacks retrieve the wrong item.
- Hint spamming also calls `rateFacet` (`log('hint')` on each hint tap), so one struggle can write multiple Hard/Again ratings (`YourTurn` / `ComebackIt`).

**If they “finish the app”:** three sentences exist in the repo, but one profile holds one language. Finishing means one sentence plus one glyph, several over-confident FSRS cards, and four locked abilities. Projected durable repertoire: **not a conversation, and not a writing system.** At most a familiar chunk, mis-attributed in the scheduler.

---

### 17. Habit & Retention Mechanics

**Cue → routine → reward**

- Cue: none outside the app. Inside, Home’s Continue hero is a cue only after the app is open.
- Routine: the 7-step path.
- Reward: clear celebration, guide praise, ability marked done. No streak, no social proof, no identity statement beyond “Good day, {name}”.

**Supports present:** local `lastActiveAt`; welcome-back headline after 5 days **if** due cards exist; soft comeback row; boss-clear counter; journey day label.

**Supports absent:** notifications, calendar, email, streak, friends, leaderboard, widget, lock-screen, reminder time.

| Session | Trigger in the product |
|---|---|
| 2nd | None. Same unit if they open the app. Comeback appears only if a reviewed card is already due, which a same-day replay may not be. |
| 7th | None. |
| 30th | None. |

The celebration rewards **finishing the path**, including paths completed via reveal and mock mic. It does not selectively reward retrieval or speech.

---

### 18. Accessibility & Inclusive Design

**Not measured** with a screen reader, contrast checker, or switch device. Gaps below are code-level unless noted.

| Topic | Code-level observation |
|---|---|
| Reduced motion | `prefers-reduced-motion` branch exists in `src/index.css` (~line 206). Not exercised. |
| Touch | Many controls use `min-h-11` / `min-h-12`. Not measured on a phone. |
| Labels | Play buttons and the Say textarea have accessible names. Decorative icons often `aria-hidden`. |
| Target-language text | No `lang` attribute found on sentence nodes. TTS sets `utterance.lang`. Screen-reader language for 今日は… was not measured. |
| RTL | Arabic is a language option. No `dir="rtl"` found in `src/`. There is no Arabic sentence to display. |
| Dyslexia / low vision | Display face is Fredoka, body Nunito (`package.json`). No dyslexia-font option, no text-spacing control. Contrast not measured. |
| Motor | Trace requires a pointer path of length ≥ 70. No keyboard alternative for ink. |
| Cognitive | Plain-language UI is generally short. Stash/listening JSON is not. |
| Captions | TTS has no transcript requirement; the written sentence is usually on screen, except the script Hear button which shows the reading, not a phonemic model. |
| Mock mic | Announced in the gate (“I’ll simulate a listen”). The field then fills with the answer. A learner who cannot speak is not blocked; they also do not get a speaking accommodation that still demands recall. |

---

### 19. UX Audit

Heuristics, from the source, not from a usability test.

- **Visibility of system status:** step chrome shows “n of N” (`SessionBits`). FSRS is hidden by design. “Level” and “day journey” look like status and mean something else.
- **Match with the world:** “I can…” cards list abilities the learner cannot do. Indonesian sentence is not what a speaker would most likely say.
- **User control:** Back from session goes Home or Stash and can resume (`canResume`). Boss can be skipped. Language cannot be changed later. No settings.
- **Consistency:** phrase path and script path share guide, chrome, and SoftFeedback. Stash paste does not feel like the same task.
- **Error prevention:** exact match and no confirmation on Spot. Build’s Check is easy to miss because success hides it.
- **Recognition vs recall:** the product leans recognition and cued chunks, then labels the outcome as being able to talk.
- **Flexibility:** type instead of mic is real. Skipping the writing system is real for Latin and for `"comfortable"`. It is not real for Japanese `"new"`.
- **Aesthetic:** one framed column (~430px from `lg`), chunky borders, one primary CTA. Matches the playful-language rule. Not evaluated with users.
- **Help:** guide bubbles on every step. Hints are generic. Debug drawer is a developer tool (`DebugDrawer.tsx`), including “force due.”
- **Empty/error:** loading is one line. Stash and listening empty states push paste flows. Session without a unit redirects Home.
- **Trust:** mic copy says nothing is uploaded (`MicListen.tsx`). Goal and “then phrases” copy over-claim relative to behavior (section 6).

---

### 20. Technical Audit

- **Stack:** React 19, Vite 8, TypeScript, Tailwind 4, React Router 7, Dexie, ts-fsrs, Fuse.js, vite-plugin-pwa. `version` 0.0.0. README is the Vite starter, not a product README.
- **State:** one React context (`AppState.tsx`, ~1000 lines) owns profile, session, stash, listening, and navigation side effects. Session snapshot is a settings row so a reload can resume.
- **Scheduler:** real library, narrow adapter. Signals table is write-only from the session path.
- **Tests:** unit tests for speech mock, writing ink, template bridge, listening pack, transcript, tutor pack, FSRS rating map. No page tests, no Dexie integration test found in the file list.
- **i18n:** English UI hardcoded. Target language is data, not a locale.
- **Security / privacy:** no auth. Profile and attempts stay in IndexedDB. Import parses JSON the user pastes (trust boundary is the user). External listening URLs are user-supplied. Mic is not uploaded by this code.
- **Performance:** not measured. Content volume is tiny (one sentence). Risk is context re-renders, not payload size.
- **Debt:** `CURRENT_UNIT` deprecated alias still exported; `SCRIPT_LEVELS` deprecated; `App.css` noted previously as unused (not re-verified this pass beyond the import graph in `main` — **unknown** if still unimported). Dictionary and sample packs are Japanese/Indonesian fixtures inside a six-language shell.

---

### 21. Data & Analytics Audit

**Captured locally:** profile fields, ability status, item rows, FSRS card JSON, session start/end and kind, attempts (activity, item, facet, outcome, hints, optional payload), fail/reveal signals, stash, listening status, boss-clear count, last active time.

**Not captured:** audio played or not, mock vs live mic, skip vs complete on Boss, time-on-step (`latencyMs` exists on the type and is not set by `recordAttempt`), notification permission, goal-conditioned exposure, whether the learner looked at the gloss, device, locale, crashes.

**Questions this data cannot answer**

1. Did anyone return on day 2, 7, or 30? (No cohort, and `journeyDay` is not a calendar.)
2. Did learners listen before they were marked listening-success?
3. Was a Say It success typed, spoken, or mocked?
4. Which error types predict quitting?
5. Does goal choice change completion? (Goal is stored; lessons do not vary, so the contrast does not exist.)
6. Did the Japanese `"new"` path produce a dead end, and how often?
7. Is the Boss scene used or skipped? (Skip writes no attempt.)
8. What do learners remember a week later? (No delayed test.)
9. Which facet is actually weak? (Comeback and Your Turn write the wrong construct onto cards.)
10. Is the app usable with a screen reader or at low vision? (No telemetry, no audit log.)

---

### 22. Issues Register

#### Learning-critical

| ID | Area | Issue | Evidence | Impact | Severity | Confidence |
|---|---|---|---|---|---|---|
| L1 | Curriculum | One sentence; three languages have no phrase unit; four ability titles have no lesson | `PHRASE_UNITS`; `buildAbilities` | Learning, trust | High | High |
| L2 | Gating | Script `"new"` on non-Latin never unlocks phrases after the warm-up | `HomePage.tsx` 43–45; familiarity never rewritten in `advanceScriptFrom` | Learning, trust | High | High |
| L3 | Assessment | Meet, Hear, Spot, Use log Good without retrieval | `SessionPage.tsx` Meet/Spot; `ScriptSessionPage.tsx` Hear/Use | Learning (scheduler) | High | High |
| L4 | Assessment | Mock mic submits the target as the learner’s line | `speech.ts` `runMockListen`; `MicListen.tsx` 74–78 | Learning, trust | High | High |
| L5 | Assessment | Your Turn rates item 0 while prompting the work word | `YourTurn` `focusId`; fixtures `turnPromptSurface` | Learning | High | High |
| L6 | Curriculum | Boss asks “what are you doing?”; target is “I have work” | `conversation.ts` 71; glosses | Learning | High | High |
| L7 | Scheduling | Due facet is not the comeback task; writing due becomes a gloss MCQ | `ComebackIt`; `listDueFacets` | Learning | High | High |
| L8 | Orthography | Session uses `glyphs[0]` only; ink check is path length | `ScriptSessionPage.tsx` 39–40; `writing.ts` 22–30 | Learning | High | High |
| L9 | Personalization | Goal does not change lessons; copy says it steers the path | `OnboardingPage.tsx` 154–155; `decideDailyPlan` inputs | Trust | High | High |
| L10 | Loop | No return cue after clear; same unit remains the hero | `advanceFrom`; Home CTA | Engagement | High | High |
| L11 | Feedback | Sentence errors are binary; no particle, tone, or register detection | `samePhrase`; conversation `usedTarget` | Learning | Med | High |
| L12 | Content | Indonesian *Hari ini saya ada kerja* is an unnatural collocation; JA existence verb ≠ activity | fixtures lines 128, 155 | Learning | Med | Med (native-speaker judgment, not a corpus count) |

#### UX / engineering polish

| ID | Area | Issue | Evidence | Impact | Severity | Confidence |
|---|---|---|---|---|---|---|
| P1 | Progress | “Level” and “day journey” are not level or days | `ProgressPage.tsx` 24; `journeyDay + 1` per clear | Trust | Med | High |
| P2 | IA | Stash and listening are JSON consoles | `StashTools.tsx`, `ListeningPost.tsx` | Engagement | Med | High |
| P3 | Content | Dictionary and sample packs ignore the active language | `DICTIONARY_SUBSET`; `SAMPLE_TUTOR_PACK_JSON` | Trust | Med | High |
| P4 | A11y | No `lang` on L2 nodes; no `dir` for Arabic; ink has no non-pointer path | section 18 | Engagement | Med | Med (code gap, not a measured user failure) |
| P5 | Copy | Script Spot stem reveals the glyph | `SpotGlyph` guide text | Learning | Low | High |
| P6 | Engineering | README is the Vite template; signals are write-only; tests skip UI | `README.md`; `attempts.ts`; test file list | Engineering | Low | High |
| P7 | Load | Build success hides Check; placeholder leaks the sentence opening | `BuildIt`; `sentencePlaceholder` | Learning | Med | High |

---

### 23. Open Questions

1. Who is the first real user: an English-speaking adult beginner, or the author demoing the prototype? The UI assumes the former; the content volume fits the latter.
2. Is Japanese `"new"` supposed to reach 今日は仕事があります after the warm-up? Copy says yes. Code says no. Which is the product?
3. Should “success” mean “advanced the screen” or “retrieved the form”? Today it means both, and they are not the same event.
4. Are sample tutor/listening packs intentionally Indonesian-only inside every language, or fixtures left in place?
5. Is there a hosted build, a Figma, or session recordings? None were in the repo. This analysis did not watch a person use the app.

---

### 24. Evidence Log

- `src/App.tsx` — routes and welcome gate
- `src/data/languages.ts` — 6 languages, goals, 5 glyphs each, script self-report copy
- `src/data/fixtures.ts` — 3 phrase units, ability list, session steps, sample packs
- `src/pages/OnboardingPage.tsx` — defaults, “steers today’s path”, “then phrases”
- `src/pages/HomePage.tsx` — `phraseReady`, plan launch
- `src/pages/SessionPage.tsx` — Meet, Spot, Break, Your Turn, Build, Say, Boss grading
- `src/pages/ScriptSessionPage.tsx` — `glyphs[0]`, Hear/Use grading, ink stages
- `src/pages/ProgressPage.tsx` line 24 — level formula
- `src/state/AppState.tsx` — `needsScriptFirst`, `advanceFrom`, `advanceScriptFrom`, `logAttempt`
- `src/learning/orchestrator.ts` — plan kinds, 5-day absence, comeback cap 3
- `src/learning/fsrsAdapter.ts` — rating map, reps > 0 filter
- `src/learning/attempts.ts` — every graded attempt calls `rateFacet`
- `src/learning/speech.ts`, `src/components/MicListen.tsx` — mock listen
- `src/learning/conversation.ts` — speech-act line, `usedTarget`
- `src/learning/templateBridge.ts` — `samePhrase`, placeholder, stash unit
- `src/learning/writing.ts` — ink length threshold
- `src/learning/tts.ts` — `speechSynthesis`, lang tags
- `src/db/seed.ts` — five facets per phrase item; three per glyph
- `package.json` — dependencies, version 0.0.0

No screenshots, analytics queries, or live URLs.

---

### 25. Recommended Next Step

Await human processing before redesign.
