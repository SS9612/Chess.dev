/**
 * Standard algebraic notation.
 *
 * Disambiguation uses the legal moves, so a pinned piece does not force an
 * extra file or rank. Check and mate suffixes are decided after the move.
 */

import { squareToAlgebraic } from './board'
import type { Position } from './board'
import { generateLegalMoves } from './legal'
import { makeMove, unmakeMove } from './makeMove'
import { positionStatus } from './status'
import type { Move } from './types'
import { KING, MOVE_CASTLE_KING, PAWN, isCapture, isCastle, pieceType } from './types'

const PIECE_LETTER = ['', '', 'N', 'B', 'R', 'Q', 'K']

export function toSan(position: Position, move: Move): string {
  const body = isCastle(move) ? castleSan(move) : moveSan(move, generateLegalMoves(position))
  const undo = makeMove(position, move)
  const status = positionStatus(position)
  unmakeMove(position, move, undo)

  if (status.outcome === 'checkmate') return `${body}#`
  if (status.inCheck) return `${body}+`
  return body
}

function castleSan(move: Move): string {
  return (move.flags & MOVE_CASTLE_KING) !== 0 ? 'O-O' : 'O-O-O'
}

function moveSan(move: Move, legal: readonly Move[]): string {
  const destination = squareToAlgebraic(move.to)
  const capture = isCapture(move) ? 'x' : ''
  const promotion = move.promotion === 0 ? '' : `=${PIECE_LETTER[move.promotion]}`

  if (pieceType(move.piece) === PAWN) {
    const file = isCapture(move) ? squareToAlgebraic(move.from)[0] : ''
    return `${file}${capture}${destination}${promotion}`
  }

  return `${PIECE_LETTER[pieceType(move.piece)]}${disambiguation(move, legal)}${capture}${destination}`
}

/**
 * The shortest prefix that distinguishes this piece from others of its type
 * that can also land on the destination: file, then rank, then both.
 */
function disambiguation(move: Move, legal: readonly Move[]): string {
  if (pieceType(move.piece) === KING) return ''

  const others = legal.filter(
    (candidate) =>
      candidate.from !== move.from &&
      candidate.to === move.to &&
      pieceType(candidate.piece) === pieceType(move.piece),
  )
  if (others.length === 0) return ''

  const origin = squareToAlgebraic(move.from)
  const sharesFile = others.some((candidate) => squareToAlgebraic(candidate.from)[0] === origin[0])
  const sharesRank = others.some((candidate) => squareToAlgebraic(candidate.from)[1] === origin[1])
  if (!sharesFile) return origin[0]
  if (!sharesRank) return origin[1]
  return origin
}
