/**
 * Perft counts legal positions reached after a number of plies.
 *
 * `perftDivide` splits that count by the move played at the root, so a wrong
 * total can be traced to one move and then to the position it produces.
 */

import type { Position } from './board'
import { squareToAlgebraic } from './board'
import { generateLegalMoves } from './legal'
import { makeMove, unmakeMove } from './makeMove'
import type { Move } from './types'

const PROMOTION_CHAR = '.pnbrqk'

export interface PerftEntry {
  move: string
  nodes: number
}

export function perft(position: Position, depth: number): number {
  if (depth === 0) return 1

  const moves = generateLegalMoves(position)
  if (depth === 1) return moves.length

  let nodes = 0
  for (const move of moves) {
    const undo = makeMove(position, move)
    nodes += perft(position, depth - 1)
    unmakeMove(position, move, undo)
  }
  return nodes
}

/** Node counts for each legal root move. The counts add up to `perft(depth)` when depth is at least 1. */
export function perftDivide(position: Position, depth: number): PerftEntry[] {
  if (depth < 1) return []

  const entries: PerftEntry[] = []
  for (const move of generateLegalMoves(position)) {
    const undo = makeMove(position, move)
    const nodes = depth === 1 ? 1 : perft(position, depth - 1)
    unmakeMove(position, move, undo)
    entries.push({ move: toUci(move), nodes })
  }

  entries.sort((a, b) => (a.move < b.move ? -1 : a.move > b.move ? 1 : 0))
  return entries
}

export function formatPerftDivide(entries: readonly PerftEntry[]): string {
  const total = entries.reduce((sum, entry) => sum + entry.nodes, 0)
  const lines = entries.map((entry) => `${entry.move}: ${entry.nodes}`)
  lines.push(`nodes: ${total}`)
  return lines.join('\n')
}

function toUci(move: Move): string {
  const promotion = move.promotion === 0 ? '' : PROMOTION_CHAR[move.promotion]
  return squareToAlgebraic(move.from) + squareToAlgebraic(move.to) + promotion
}
