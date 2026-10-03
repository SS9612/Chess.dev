import { describe, expect, it } from 'vitest'
import type { MoveRecord } from '../engine/gameApi.ts'
import type { Move } from '../engine/types.ts'
import { BLACK, WHITE, makePiece, PAWN, KNIGHT } from '../engine/types.ts'
import { moveRows } from './moveRows.ts'

function record(color: typeof WHITE | typeof BLACK, type: 1 | 2, san: string): MoveRecord {
  const move: Move = {
    from: 0,
    to: 0,
    piece: makePiece(color, type),
    captured: 0,
    promotion: 0,
    flags: 0,
  }
  return { move, san, fen: '' }
}

describe('moveRows', () => {
  it('is empty when nothing has been played', () => {
    expect(moveRows([], 1)).toEqual([])
  })

  it('puts a single white move on row 1', () => {
    expect(moveRows([record(WHITE, PAWN, 'e4')], 1)).toEqual([
      { number: 1, white: 'e4', black: null },
    ])
  })

  it('pairs white and black on the same number', () => {
    const history = [record(WHITE, PAWN, 'e4'), record(BLACK, PAWN, 'e5')]
    expect(moveRows(history, 2)).toEqual([{ number: 1, white: 'e4', black: 'e5' }])
  })

  it('starts the next pair after black has replied', () => {
    const history = [
      record(WHITE, PAWN, 'e4'),
      record(BLACK, PAWN, 'e5'),
      record(WHITE, KNIGHT, 'Nf3'),
    ]
    expect(moveRows(history, 2)).toEqual([
      { number: 1, white: 'e4', black: 'e5' },
      { number: 2, white: 'Nf3', black: null },
    ])
  })

  it('shows a leading black move against its own number', () => {
    expect(moveRows([record(BLACK, PAWN, 'e5')], 2)).toEqual([
      { number: 1, white: null, black: 'e5' },
    ])
  })
})
