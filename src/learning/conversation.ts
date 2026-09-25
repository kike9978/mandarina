import type { PhraseUnit } from '../data/fixtures'
import { samePhrase } from './templateBridge'

export interface ConversationBrief {
  title: string
  scene: string
  targets: string[]
  prompt: string
}

export interface CorrectionEvent {
  almost: string
  expected: string
  why: string
}

export interface ConversationReply {
  npcMessage: string
  correction?: CorrectionEvent
  done?: boolean
  usedTarget?: boolean
}

export interface ConversationProvider {
  brief(unit: PhraseUnit): ConversationBrief
  start(unit: PhraseUnit): Promise<{ npcMessage: string }>
  reply(unit: PhraseUnit, learnerText: string): Promise<ConversationReply>
}

function usedTarget(unit: PhraseUnit, learnerText: string): boolean {
  return samePhrase(learnerText, unit.targetSentence)
}

/** Canned roleplay — no network. Reuses the unit sentence. */
export class MockConversationProvider implements ConversationProvider {
  private turn = 0
  private corrected = false

  brief(unit: PhraseUnit): ConversationBrief {
    const stash = unit.origin === 'stash'
    return {
      title: stash ? 'Use your stashed phrases' : 'Talk about today',
      scene: stash
        ? 'A friend just bumped into you and wants to hear the phrase you stashed.'
        : 'A classmate asks what you’re doing today — use the sentence you just built.',
      targets: [unit.targetGloss],
      prompt: stash
        ? 'Try to use your phrase in a short reply.'
        : 'Answer with today’s sentence — or close enough.',
    }
  }

  async start(unit: PhraseUnit): Promise<{ npcMessage: string }> {
    this.turn = 0
    this.corrected = false
    await pause(280)
    return {
      npcMessage:
        unit.origin === 'stash'
          ? `Hey — what was that you wanted to say? Something like “${unit.targetGloss}”?`
          : 'Hey! What are you doing today?',
    }
  }

  async reply(
    unit: PhraseUnit,
    learnerText: string,
  ): Promise<ConversationReply> {
    await pause(320)
    this.turn += 1
    const hit = usedTarget(unit, learnerText)
    const trimmed = learnerText.trim()

    if (!hit && !this.corrected) {
      this.corrected = true
      return {
        npcMessage: 'Almost — say it the way we practiced, then I’ll catch it.',
        correction: {
          almost: trimmed || '(empty)',
          expected: unit.targetSentence,
          why: `That’s the form for “${unit.targetGloss}.”`,
        },
        usedTarget: false,
      }
    }

    if (hit && this.turn >= 2) {
      return {
        npcMessage: 'Nice — that lands. See you later!',
        done: true,
        usedTarget: true,
      }
    }

    const followUps = [
      'Oh yeah? Tell me again, just so I hear the whole thing.',
      'Got it. One more time — like you’re telling a friend.',
      'Cool. Use the same sentence once more and we’re good.',
    ]
    return {
      npcMessage: followUps[Math.min(this.turn - 1, followUps.length - 1)],
      usedTarget: hit,
      done: false,
    }
  }
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
