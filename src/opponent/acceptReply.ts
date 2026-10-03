/**
 * Plays a reply only when it names a legal move.
 *
 * Check and mate marks, and castling written with zeros, still count. An
 * unreadable or illegal reply is replaced by another legal move.
 */

import type { GameApi } from '../engine/gameApi.ts'
import { toSan } from '../engine/san.ts'
import type { Move } from '../engine/types.ts'
import { fallbackMove } from './chooseMove.ts'

const SAN =
  /(?:O-O-O|O-O|[NBRQKnbrqk][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x[a-h][1-8]|[a-h][1-8])(?:=[NBRQKnbrqk])?[+#]?/g

export function acceptReply(game: GameApi, reply: string): string | null {
  const position = game.position()
  const moves = new Map<string, Move>()
  for (const move of game.legalMoves()) {
    moves.set(toSan(position, move), move)
  }

  const chosen = matchReply(reply, [...moves.keys()]) ?? fallbackMove([...moves.keys()])
  if (chosen === null) return null

  const move = moves.get(chosen)
  if (move === undefined) return null

  const promotion = move.promotion === 0 ? undefined : move.promotion
  const played = game.move(move.from, move.to, promotion)
  return played === null ? null : chosen
}

function matchReply(reply: string, legal: readonly string[]): string | null {
  const normalized = reply.replace(/0-0-0/gi, 'O-O-O').replace(/0-0/gi, 'O-O').replace(/o-o-o/gi, 'O-O-O').replace(/o-o/gi, 'O-O')
  const byBody = new Map(legal.map((move) => [stripMarks(move), move]))
  const tokens = normalized.match(SAN) ?? []

  for (const token of tokens) {
    const match = byBody.get(stripMarks(canonicalize(token)))
    if (match !== undefined) return match
  }
  return null
}

function canonicalize(token: string): string {
  return token
    .replace(/^[nbrqk]/, (letter) => letter.toUpperCase())
    .replace(/=([nbrqk])/, (_mark, letter: string) => `=${letter.toUpperCase()}`)
}

function stripMarks(san: string): string {
  return san.replace(/[+#]/g, '')
}
