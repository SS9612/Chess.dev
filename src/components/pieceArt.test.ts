import { describe, expect, it } from 'vitest'
import { BLACK, KING, KNIGHT, PAWN, QUEEN, WHITE, makePiece } from '../engine/types.ts'
import { pieceMarkup, pieceName } from './pieceArt.ts'

describe('pieceMarkup', () => {
  it('returns nothing for an empty square', () => {
    expect(pieceMarkup(0)).toBeNull()
  })

  it('paints white pieces in the light gradient with a dark stroke', () => {
    const markup = pieceMarkup(makePiece(WHITE, KING))
    expect(markup).toContain('fill="url(#piece-light)"')
    expect(markup).toContain('stroke="#1c2838"')
    expect(markup).not.toContain('#fff')
    expect(markup).not.toContain('#000')
  })

  it('paints black pieces in the dark gradient with a light stroke', () => {
    const markup = pieceMarkup(makePiece(BLACK, QUEEN))
    expect(markup).toContain('fill="url(#piece-dark)"')
    expect(markup).toContain('stroke="#f6edff"')
  })

  it('keeps the knight eye as a contrasting dot', () => {
    expect(pieceMarkup(makePiece(WHITE, KNIGHT))).toContain('fill="#1c2838"')
    expect(pieceMarkup(makePiece(BLACK, KNIGHT))).toContain('fill="#f6edff"')
  })

  it('names each piece', () => {
    expect(pieceName(makePiece(WHITE, PAWN))).toBe('White pawn')
    expect(pieceName(makePiece(BLACK, KING))).toBe('Black king')
  })
})
