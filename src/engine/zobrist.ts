/**
 * Zobrist keys.
 *
 * Each piece-square, castling right, en passant file and the side to move has
 * a random 64-bit number from a fixed seed, so a position hashes the same way
 * on every run. Make and unmake fold those numbers in with XOR, and hashing
 * the board from scratch must produce the same key. The clocks are left out.
 */

import type { Position } from './board'
import { NO_SQUARE, eachSquare, fileOf, rankOf, squareOf } from './board'
import type { Move, Piece } from './types'
import { BLACK, EMPTY, MOVE_CASTLE_KING, ROOK, isCastle, isEnPassant, makePiece, pieceColor } from './types'

const MASK = 0xffff_ffff_ffff_ffffn

/** SplitMix64. The seed is fixed so keys do not depend on the clock or Math.random. */
const nextRandom = splitmix64(0x9e3779b97f4a7c15n)

const PIECE_KEY: bigint[][] = Array.from({ length: 128 }, () => [])
for (const square of eachSquare()) {
  PIECE_KEY[square] = Array.from({ length: 12 }, () => nextRandom())
}

const CASTLE_BIT = Array.from({ length: 4 }, () => nextRandom())
const CASTLE_KEY = Array.from({ length: 16 }, (_, rights) => {
  let key = 0n
  for (let bit = 0; bit < 4; bit++) {
    if ((rights & (1 << bit)) !== 0) key ^= CASTLE_BIT[bit]
  }
  return key
})

const EP_KEY = Array.from({ length: 8 }, () => nextRandom())
const SIDE_KEY = nextRandom()

export function hashPosition(position: Position): bigint {
  let key = 0n
  for (const square of eachSquare()) {
    const piece = position.board[square]
    if (piece !== EMPTY) key ^= pieceKey(square, piece)
  }
  key ^= CASTLE_KEY[position.castling]
  key ^= epKey(position.epSquare)
  if (position.turn === BLACK) key ^= SIDE_KEY
  return key
}

/**
 * Folds a move into a key. The piece change is its own inverse, so the same
 * call undoes a move when `before` and `after` are swapped.
 */
export function updateKey(
  key: bigint,
  move: Move,
  before: { castling: number; epSquare: number },
  after: { castling: number; epSquare: number },
): bigint {
  const color = pieceColor(move.piece)
  const placed = move.promotion === 0 ? move.piece : makePiece(color, move.promotion)

  key ^= pieceKey(move.from, move.piece)
  key ^= pieceKey(move.to, placed)

  if (isEnPassant(move)) {
    key ^= pieceKey(squareOf(fileOf(move.to), rankOf(move.from)), move.captured)
  } else if (isCastle(move)) {
    const rook = makePiece(color, ROOK)
    const kingside = (move.flags & MOVE_CASTLE_KING) !== 0
    const rookFrom = kingside ? move.to + 1 : move.to - 2
    const rookTo = kingside ? move.to - 1 : move.to + 1
    key ^= pieceKey(rookFrom, rook)
    key ^= pieceKey(rookTo, rook)
  } else if (move.captured !== EMPTY) {
    key ^= pieceKey(move.to, move.captured)
  }

  key ^= CASTLE_KEY[before.castling]
  key ^= CASTLE_KEY[after.castling]
  key ^= epKey(before.epSquare)
  key ^= epKey(after.epSquare)
  key ^= SIDE_KEY
  return key
}

function pieceKey(square: number, piece: Piece): bigint {
  const index = piece > 0 ? piece - 1 : 5 - piece
  return PIECE_KEY[square][index]
}

function epKey(square: number): bigint {
  if (square === NO_SQUARE) return 0n
  return EP_KEY[fileOf(square)]
}

function splitmix64(seed: bigint): () => bigint {
  let state = seed & MASK
  return () => {
    state = (state + 0x9e3779b97f4a7c15n) & MASK
    let z = state
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MASK
    return (z ^ (z >> 31n)) & MASK
  }
}
