import { describe, expect, it } from 'vitest'
import { algebraicToSquare } from '../engine/board.ts'
import type { Move } from '../engine/types.ts'
import { MOVE_CAPTURE, MOVE_EN_PASSANT, makePiece, BLACK, PAWN } from '../engine/types.ts'
import { capturedSquare, moveTravel } from './moveTravel.ts'

function played(from: string, to: string): Move {
  return {
    from: algebraicToSquare(from),
    to: algebraicToSquare(to),
    piece: 1,
    captured: 0,
    promotion: 0,
    flags: 0,
  }
}

describe('moveTravel', () => {
  const move = played('e2', 'e4')

  it('is empty off the destination square', () => {
    expect(moveTravel(algebraicToSquare('e2'), move, 'white')).toBeNull()
    expect(moveTravel(algebraicToSquare('e4'), null, 'white')).toBeNull()
  })

  it('starts a white pawn two squares below its destination', () => {
    expect(moveTravel(algebraicToSquare('e4'), move, 'white')).toEqual({ x: 0, y: 2 })
  })

  it('starts that same pawn two squares above the destination when the board is flipped', () => {
    expect(moveTravel(algebraicToSquare('e4'), move, 'black')).toEqual({ x: 0, y: -2 })
  })

  it('starts a knight on its origin square', () => {
    expect(moveTravel(algebraicToSquare('f3'), played('g1', 'f3'), 'white')).toEqual({ x: 1, y: 2 })
  })
})

describe('capturedSquare', () => {
  it('is empty when nothing was taken', () => {
    expect(capturedSquare(played('e2', 'e4'))).toBeNull()
    expect(capturedSquare(null)).toBeNull()
  })

  it('is the destination of an ordinary capture', () => {
    const move = played('e4', 'e5')
    move.flags = MOVE_CAPTURE
    move.captured = makePiece(BLACK, PAWN)
    expect(capturedSquare(move)).toBe(algebraicToSquare('e5'))
  })

  it('is the passed pawn for an en passant capture', () => {
    const move = played('e5', 'd6')
    move.flags = MOVE_CAPTURE | MOVE_EN_PASSANT
    move.captured = makePiece(BLACK, PAWN)
    expect(capturedSquare(move)).toBe(algebraicToSquare('d5'))
  })
})
