/**
 * Asks for one move in standard algebraic notation.
 *
 * The request goes to a local Ollama model through the Vite proxy. Moves are
 * ranked with a light heuristic first so the model sees stronger options early
 * and the legal fallback is not a random edge pawn. When Ollama is down, the
 * usual legal fallback still plays.
 *
 * Pull a model once with `ollama pull llama3.2` (or set VITE_OLLAMA_MODEL).
 */

import type { MoveContext } from './context.ts'
import { rankSans } from './rankMoves.ts'

/** Default model name. Override with VITE_OLLAMA_MODEL after `ollama pull`. */
const DEFAULT_MODEL = 'llama3.2'

const OLLAMA_CHAT = '/api/ollama/api/chat'
/** Hard ceiling so Thinking… never waits forever if the proxy stalls. */
const REQUEST_MS = 30_000

export function chooseMove(context: MoveContext): Promise<string | null> {
  if (context.legalMoves.length === 0) return Promise.resolve(null)
  return askOllama(context)
}

/** A legal move to use when a reply cannot be played. */
export function fallbackMove(legalMoves: readonly string[]): string | null {
  if (legalMoves.length === 0) return null
  return rankSans(legalMoves)[0] ?? null
}

async function askOllama(context: MoveContext): Promise<string | null> {
  const model =
    typeof import.meta.env.VITE_OLLAMA_MODEL === 'string' && import.meta.env.VITE_OLLAMA_MODEL !== ''
      ? import.meta.env.VITE_OLLAMA_MODEL
      : DEFAULT_MODEL

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_MS)
  const candidates = candidatesFor(context)

  try {
    const response = await Promise.race([
      fetch(OLLAMA_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          options: {
            num_predict: 32,
            temperature: context.difficulty === 'easy' ? 0.7 : 0.1,
          },
          messages: [
            {
              role: 'system',
              content: [
                'You are a competent chess engine playing Black.',
                'Choose exactly one move from the candidate list.',
                'The list is ordered with stronger-looking moves first — prefer earlier entries unless a later one is clearly better.',
                'Reply with the move only. No commentary.',
              ].join(' '),
            },
            { role: 'user', content: promptFor(context, candidates) },
          ],
        }),
        signal: controller.signal,
      }),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error('ollama-timeout')), REQUEST_MS)
      }),
    ])

    if (!response.ok) return '???'

    const payload = (await response.json()) as { message?: { content?: string } }
    const text = payload.message?.content?.trim()
    return text === undefined || text === '' ? '???' : text
  } catch {
    return '???'
  } finally {
    clearTimeout(timer)
  }
}

function candidatesFor(context: MoveContext): string[] {
  const ranked = rankSans(context.legalMoves)
  if (context.difficulty === 'hard') return ranked.slice(0, Math.min(12, ranked.length))
  if (context.difficulty === 'easy') {
    // Offer the quieter half so the model is steered away from sharp replies.
    const start = Math.floor(ranked.length / 2)
    return ranked.slice(start)
  }
  return ranked
}

function promptFor(context: MoveContext, candidates: string[]): string {
  const history = context.history.length === 0 ? '(none)' : context.history.join(' ')
  return [
    `Difficulty: ${context.difficulty}`,
    context.instructions,
    `You are Black. Side to move is Black.`,
    `FEN: ${context.fen}`,
    `Moves so far: ${history}`,
    `Candidates (stronger first): ${candidates.join(', ')}`,
    'Reply with one candidate move and nothing else.',
  ].join('\n')
}
