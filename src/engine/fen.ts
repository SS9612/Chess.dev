/**
 * Forsyth-Edwards Notation, the standard text format for a chess position.
 *
 * Every test position and debugging session in this engine is expressed as a
 * FEN string, which is why this lands before move generation.
 *
 * The six space-separated fields are piece placement (rank 8 first), side to
 * move, castling rights, en passant target, halfmove clock and fullmove number.
 * The two clock fields are optional here because published test positions often
 * omit them.
 */

import type { Board, Position } from './board'
import {
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  NO_SQUARE,
  algebraicToSquare,
  charToPiece,
  createEmptyBoard,
  pieceToChar,
  rankOf,
  squareOf,
  squareToAlgebraic,
} from './board'
import type { Color } from './types'
import { BLACK, EMPTY, WHITE } from './types'

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const CASTLING_CHARS: ReadonlyArray<readonly [string, number]> = [
  ['K', CASTLE_WK],
  ['Q', CASTLE_WQ],
  ['k', CASTLE_BK],
  ['q', CASTLE_BQ],
]

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/)
  if (fields.length < 4) {
    throw new Error(`FEN needs at least 4 fields, got ${fields.length}: "${fen}"`)
  }

  return {
    board: parsePlacement(fields[0]),
    turn: parseTurn(fields[1]),
    castling: parseCastling(fields[2]),
    epSquare: parseEpSquare(fields[3]),
    halfmoveClock: fields.length > 4 ? parseCount(fields[4], 'halfmove clock') : 0,
    fullmoveNumber: fields.length > 5 ? parseCount(fields[5], 'fullmove number') : 1,
  }
}

export function toFen(position: Position): string {
  return [
    formatPlacement(position.board),
    position.turn === WHITE ? 'w' : 'b',
    formatCastling(position.castling),
    position.epSquare === NO_SQUARE ? '-' : squareToAlgebraic(position.epSquare),
    String(position.halfmoveClock),
    String(position.fullmoveNumber),
  ].join(' ')
}

function parsePlacement(field: string): Board {
  const ranks = field.split('/')
  if (ranks.length !== 8) {
    throw new Error(`FEN placement needs 8 ranks, got ${ranks.length}: "${field}"`)
  }

  const board = createEmptyBoard()
  for (let i = 0; i < 8; i++) {
    // Placement is written from rank 8 downwards, so the first entry is rank 7.
    const rank = 7 - i
    let file = 0

    for (const char of ranks[i]) {
      if (char >= '1' && char <= '8') {
        file += Number(char)
      } else {
        if (file > 7) {
          throw new Error(`FEN rank ${rank + 1} overflows past the h-file: "${ranks[i]}"`)
        }
        board[squareOf(file, rank)] = charToPiece(char)
        file++
      }
    }

    if (file !== 8) {
      throw new Error(`FEN rank ${rank + 1} describes ${file} squares, expected 8: "${ranks[i]}"`)
    }
  }
  return board
}

function formatPlacement(board: Board): string {
  const ranks: string[] = []
  for (let rank = 7; rank >= 0; rank--) {
    let text = ''
    let empty = 0

    for (let file = 0; file < 8; file++) {
      const piece = board[squareOf(file, rank)]
      if (piece === EMPTY) {
        empty++
        continue
      }
      if (empty > 0) {
        text += empty
        empty = 0
      }
      text += pieceToChar(piece)
    }

    if (empty > 0) text += empty
    ranks.push(text)
  }
  return ranks.join('/')
}

function parseTurn(field: string): Color {
  if (field === 'w') return WHITE
  if (field === 'b') return BLACK
  throw new Error(`FEN side to move must be "w" or "b", got "${field}"`)
}

function parseCastling(field: string): number {
  if (field === '-') return 0

  let rights = 0
  for (const char of field) {
    const entry = CASTLING_CHARS.find(([letter]) => letter === char)
    if (entry === undefined) {
      throw new Error(`FEN castling field has invalid character "${char}"`)
    }
    rights |= entry[1]
  }
  return rights
}

function formatCastling(rights: number): string {
  const text = CASTLING_CHARS.filter(([, flag]) => (rights & flag) !== 0)
    .map(([letter]) => letter)
    .join('')
  return text === '' ? '-' : text
}

function parseEpSquare(field: string): number {
  if (field === '-') return NO_SQUARE

  const square = algebraicToSquare(field)
  if (rankOf(square) !== 2 && rankOf(square) !== 5) {
    throw new Error(`FEN en passant target must be on rank 3 or 6, got "${field}"`)
  }
  return square
}

function parseCount(field: string, label: string): number {
  if (!/^\d+$/.test(field)) {
    throw new Error(`FEN ${label} must be a non-negative integer, got "${field}"`)
  }
  return Number(field)
}
