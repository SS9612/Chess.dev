import bishop from '../assets/pieces/wB.svg?raw'
import king from '../assets/pieces/wK.svg?raw'
import knight from '../assets/pieces/wN.svg?raw'
import pawn from '../assets/pieces/wP.svg?raw'
import queen from '../assets/pieces/wQ.svg?raw'
import rook from '../assets/pieces/wR.svg?raw'
import type { Piece, PieceType } from '../engine/types.ts'
import { BISHOP, EMPTY, KING, KNIGHT, PAWN, QUEEN, ROOK, pieceType } from '../engine/types.ts'

/**
 * Silhouettes are the Cburnett set. See LICENSES.md.
 * Fills and strokes are swapped here so both sides read on the dark board.
 */

const SHAPES: Record<PieceType, string> = {
  [PAWN]: pawn,
  [KNIGHT]: knight,
  [BISHOP]: bishop,
  [ROOK]: rook,
  [QUEEN]: queen,
  [KING]: king,
}

const TYPE_NAMES: Record<PieceType, string> = {
  [PAWN]: 'pawn',
  [KNIGHT]: 'knight',
  [BISHOP]: 'bishop',
  [ROOK]: 'rook',
  [QUEEN]: 'queen',
  [KING]: 'king',
}

export function pieceName(piece: Piece): string {
  const side = piece > 0 ? 'White' : 'Black'
  return `${side} ${TYPE_NAMES[pieceType(piece)]}`
}

/** SVG markup for a piece, or null when the square is empty. */
export function pieceMarkup(piece: Piece): string | null {
  if (piece === EMPTY) return null

  const light = piece > 0
  const fill = light ? 'url(#piece-light)' : 'url(#piece-dark)'
  const ink = light ? '#1c2838' : '#f6edff'

  return SHAPES[pieceType(piece)]
    .replace('style="color-scheme:light only" ', '')
    .replaceAll('fill="#fff"', `fill="${fill}"`)
    .replaceAll('fill="#000"', `fill="${ink}"`)
    .replaceAll('stroke="#000"', `stroke="${ink}"`)
}
