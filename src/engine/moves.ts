/**
 * Pseudo-legal move generation.
 *
 * A move is included even when it leaves the mover's king in check. Own pieces
 * block a square. Enemy pieces can be captured. Castling requires the right and
 * empty squares between the king and rook. It does not test whether the king
 * passes through check.
 */

import type { Board, Position } from './board'
import {
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  eachSquare,
  fileOf,
  isOnBoard,
  rankOf,
  squareOf,
} from './board'
import type { Move, Piece, Square } from './types'
import {
  BISHOP,
  BLACK,
  EMPTY,
  KING,
  KNIGHT,
  makePiece,
  MOVE_CAPTURE,
  MOVE_CASTLE_KING,
  MOVE_CASTLE_QUEEN,
  MOVE_DOUBLE_PUSH,
  MOVE_EN_PASSANT,
  MOVE_PROMOTION,
  MOVE_QUIET,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
  isColor,
  pieceColor,
  pieceType,
} from './types'

/** One step for a knight, in 0x88 squares. An off-board step fails the 0x88 test. */
const KNIGHT_OFFSETS = [14, 18, 31, 33, -14, -18, -31, -33]

/** One step for a king, excluding castling. */
const KING_OFFSETS = [1, -1, 16, -16, 15, -15, 17, -17]

const ROOK_OFFSETS = [1, -1, 16, -16]
const BISHOP_OFFSETS = [15, -15, 17, -17]
const QUEEN_OFFSETS = [...ROOK_OFFSETS, ...BISHOP_OFFSETS]

/** Every pseudo-legal move for the side to move. */
export function generateMoves(position: Position): Move[] {
  const moves: Move[] = []
  for (const square of eachSquare()) {
    moves.push(...generateMovesFrom(position, square))
  }
  return moves
}

/** Pseudo-legal moves for the piece on `from`. Empty when it is not that side's piece. */
export function generateMovesFrom(position: Position, from: Square): Move[] {
  if (!isOnBoard(from)) return []
  const piece = position.board[from]
  if (!isColor(piece, position.turn)) return []

  switch (pieceType(piece)) {
    case KNIGHT:
      return leap(position.board, from, piece, KNIGHT_OFFSETS)
    case KING:
      return [
        ...leap(position.board, from, piece, KING_OFFSETS),
        ...castleMoves(position, from, piece),
      ]
    case ROOK:
      return slide(position.board, from, piece, ROOK_OFFSETS)
    case BISHOP:
      return slide(position.board, from, piece, BISHOP_OFFSETS)
    case QUEEN:
      return slide(position.board, from, piece, QUEEN_OFFSETS)
    case PAWN:
      return pawnMoves(position, from, piece)
    default:
      return []
  }
}

const CASTLING = [
  { color: WHITE, right: CASTLE_WK, king: squareOf(4, 0), rook: squareOf(7, 0), to: squareOf(6, 0), between: [squareOf(5, 0), squareOf(6, 0)], flag: MOVE_CASTLE_KING },
  { color: WHITE, right: CASTLE_WQ, king: squareOf(4, 0), rook: squareOf(0, 0), to: squareOf(2, 0), between: [squareOf(1, 0), squareOf(2, 0), squareOf(3, 0)], flag: MOVE_CASTLE_QUEEN },
  { color: BLACK, right: CASTLE_BK, king: squareOf(4, 7), rook: squareOf(7, 7), to: squareOf(6, 7), between: [squareOf(5, 7), squareOf(6, 7)], flag: MOVE_CASTLE_KING },
  { color: BLACK, right: CASTLE_BQ, king: squareOf(4, 7), rook: squareOf(0, 7), to: squareOf(2, 7), between: [squareOf(1, 7), squareOf(2, 7), squareOf(3, 7)], flag: MOVE_CASTLE_QUEEN },
] as const

function castleMoves(position: Position, from: Square, piece: Piece): Move[] {
  const moves: Move[] = []
  const color = pieceColor(piece)

  for (const side of CASTLING) {
    if (color !== side.color || from !== side.king) continue
    if ((position.castling & side.right) === 0) continue
    if (position.board[side.rook] !== makePiece(color, ROOK)) continue
    if (side.between.some((square) => position.board[square] !== EMPTY)) continue

    moves.push({
      from,
      to: side.to,
      piece,
      captured: EMPTY,
      promotion: 0,
      flags: side.flag,
    })
  }
  return moves
}

function leap(board: Board, from: Square, piece: Piece, offsets: readonly number[]): Move[] {
  const moves: Move[] = []
  for (const offset of offsets) {
    const to = from + offset
    if (!isOnBoard(to)) continue

    const target = board[to]
    if (isColor(target, pieceColor(piece))) continue

    moves.push(moveTo(from, to, piece, target))
  }
  return moves
}

/** Walks each ray until the board edge, a capture, or one of the mover's own pieces. */
function slide(board: Board, from: Square, piece: Piece, offsets: readonly number[]): Move[] {
  const moves: Move[] = []
  const color = pieceColor(piece)

  for (const offset of offsets) {
    let to = from + offset
    while (isOnBoard(to)) {
      const target = board[to]
      if (isColor(target, color)) break
      moves.push(moveTo(from, to, piece, target))
      if (target !== EMPTY) break
      to += offset
    }
  }
  return moves
}

function moveTo(from: Square, to: Square, piece: Piece, target: Piece): Move {
  return {
    from,
    to,
    piece,
    captured: target,
    promotion: 0,
    flags: target === EMPTY ? MOVE_QUIET : MOVE_CAPTURE,
  }
}

/** One step forward, two steps from the pawn's starting rank, diagonal captures, en passant, and promotion. */
function pawnMoves(position: Position, from: Square, piece: Piece): Move[] {
  const board = position.board
  const color = pieceColor(piece)
  const forward = color === WHITE ? 16 : -16
  const startRank = color === WHITE ? 1 : 6
  const moves: Move[] = []

  const one = from + forward
  if (isOnBoard(one) && board[one] === EMPTY) {
    addPawnMove(moves, from, one, piece, EMPTY, MOVE_QUIET)
    const two = one + forward
    if (rankOf(from) === startRank && isOnBoard(two) && board[two] === EMPTY) {
      addPawnMove(moves, from, two, piece, EMPTY, MOVE_DOUBLE_PUSH)
    }
  }

  for (const offset of [forward - 1, forward + 1]) {
    const to = from + offset
    if (!isOnBoard(to)) continue
    const target = board[to]
    if (target !== EMPTY && !isColor(target, color)) {
      addPawnMove(moves, from, to, piece, target, MOVE_CAPTURE)
    } else if (to === position.epSquare) {
      const victim = board[squareOf(fileOf(to), rankOf(from))]
      if (pieceType(victim) === PAWN && !isColor(victim, color)) {
        addPawnMove(moves, from, to, piece, victim, MOVE_CAPTURE | MOVE_EN_PASSANT)
      }
    }
  }

  return moves
}

function addPawnMove(
  moves: Move[],
  from: Square,
  to: Square,
  piece: Piece,
  captured: Piece,
  flags: number,
): void {
  const promoting = rankOf(to) === 0 || rankOf(to) === 7
  if (!promoting) {
    moves.push({ from, to, piece, captured, promotion: 0, flags })
    return
  }

  for (const promotion of [QUEEN, ROOK, BISHOP, KNIGHT]) {
    moves.push({ from, to, piece, captured, promotion, flags: flags | MOVE_PROMOTION })
  }
}
