/**
 * Apply a pseudo-legal move and reverse it.
 *
 * Both functions mutate the position. The undo record keeps the captured piece
 * and the castling rights, en passant square and clocks from before the move.
 */

import type { Position } from './board'
import {
  CASTLE_ALL,
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  NO_SQUARE,
  fileOf,
  rankOf,
  squareOf,
} from './board'
import type { Move, Piece } from './types'
import {
  BLACK,
  EMPTY,
  MOVE_CASTLE_KING,
  MOVE_DOUBLE_PUSH,
  PAWN,
  isCastle,
  isEnPassant,
  makePiece,
  opposite,
  pieceColor,
  pieceType,
} from './types'
import { updateKey } from './zobrist'

export interface Undo {
  captured: Piece
  castling: number
  epSquare: number
  halfmoveClock: number
  fullmoveNumber: number
}

/**
 * Rights that survive a piece leaving or landing on this square. Every square
 * keeps the full set except the four corners and the two king homes, which
 * drop the castling right that depended on the piece that was there.
 */
const CASTLE_MASK = new Uint8Array(128).fill(CASTLE_ALL)
CASTLE_MASK[squareOf(0, 0)] = CASTLE_ALL & ~CASTLE_WQ
CASTLE_MASK[squareOf(7, 0)] = CASTLE_ALL & ~CASTLE_WK
CASTLE_MASK[squareOf(4, 0)] = CASTLE_ALL & ~(CASTLE_WK | CASTLE_WQ)
CASTLE_MASK[squareOf(0, 7)] = CASTLE_ALL & ~CASTLE_BQ
CASTLE_MASK[squareOf(7, 7)] = CASTLE_ALL & ~CASTLE_BK
CASTLE_MASK[squareOf(4, 7)] = CASTLE_ALL & ~(CASTLE_BK | CASTLE_BQ)

export function makeMove(position: Position, move: Move): Undo {
  const undo: Undo = {
    captured: move.captured,
    castling: position.castling,
    epSquare: position.epSquare,
    halfmoveClock: position.halfmoveClock,
    fullmoveNumber: position.fullmoveNumber,
  }

  const board = position.board
  const color = pieceColor(move.piece)
  const nextCastling = position.castling & CASTLE_MASK[move.from] & CASTLE_MASK[move.to]
  const nextEp = (move.flags & MOVE_DOUBLE_PUSH) !== 0 ? (move.from + move.to) >> 1 : NO_SQUARE
  position.key = updateKey(
    position.key,
    move,
    { castling: position.castling, epSquare: position.epSquare },
    { castling: nextCastling, epSquare: nextEp },
  )

  board[move.from] = EMPTY

  if (isEnPassant(move)) board[enPassantSquare(move)] = EMPTY
  if (isCastle(move)) moveRook(board, move, true)

  board[move.to] = move.promotion === 0 ? move.piece : makePiece(color, move.promotion)

  position.castling = nextCastling
  position.epSquare = nextEp
  position.halfmoveClock =
    pieceType(move.piece) === PAWN || move.captured !== EMPTY ? 0 : position.halfmoveClock + 1

  if (position.turn === BLACK) position.fullmoveNumber += 1
  position.turn = opposite(position.turn)

  return undo
}

export function unmakeMove(position: Position, move: Move, undo: Undo): void {
  position.key = updateKey(
    position.key,
    move,
    { castling: position.castling, epSquare: position.epSquare },
    { castling: undo.castling, epSquare: undo.epSquare },
  )

  const board = position.board
  board[move.from] = move.piece

  if (isEnPassant(move)) {
    board[move.to] = EMPTY
    board[enPassantSquare(move)] = undo.captured
  } else if (isCastle(move)) {
    board[move.to] = EMPTY
    moveRook(board, move, false)
  } else {
    board[move.to] = undo.captured
  }

  position.castling = undo.castling
  position.epSquare = undo.epSquare
  position.halfmoveClock = undo.halfmoveClock
  position.fullmoveNumber = undo.fullmoveNumber
  position.turn = opposite(position.turn)
}

/** The pawn taken en passant stands beside the mover, on the mover's rank. */
function enPassantSquare(move: Move): number {
  return squareOf(fileOf(move.to), rankOf(move.from))
}

/** Kingside rook steps inward from the corner; queenside rook steps to the square beside the king. */
function moveRook(board: Position['board'], move: Move, forward: boolean): void {
  const kingside = (move.flags & MOVE_CASTLE_KING) !== 0
  const rookFrom = kingside ? move.to + 1 : move.to - 2
  const rookTo = kingside ? move.to - 1 : move.to + 1
  if (forward) {
    board[rookTo] = board[rookFrom]
    board[rookFrom] = EMPTY
    return
  }
  board[rookFrom] = board[rookTo]
  board[rookTo] = EMPTY
}
