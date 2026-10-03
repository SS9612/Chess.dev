import { describe, expect, it } from 'vitest'
import { NO_SQUARE, algebraicToSquare } from './board'
import { START_FEN, parseFen, toFen } from './fen'
import { positionStatus } from './status'
import { BLACK, WHITE } from './types'

const sq = algebraicToSquare

describe('position status', () => {
  it('reports the starting position as playable', () => {
    const position = parseFen(START_FEN)
    expect(positionStatus(position)).toEqual({
      outcome: 'playing',
      turn: WHITE,
      inCheck: false,
      checkSquare: NO_SQUARE,
      winner: null,
      drawReason: null,
    })
    expect(toFen(position)).toBe(START_FEN)
  })

  it('reports check while a reply still exists', () => {
    expect(positionStatus(parseFen('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1'))).toEqual({
      outcome: 'playing',
      turn: WHITE,
      inCheck: true,
      checkSquare: sq('e1'),
      winner: null,
      drawReason: null,
    })
  })

  it('reports check when only the king can answer double check', () => {
    const status = positionStatus(parseFen('4r2k/8/8/8/1b6/8/8/4K3 w - - 0 1'))
    expect(status.outcome).toBe('playing')
    expect(status.inCheck).toBe(true)
    expect(status.checkSquare).toBe(sq('e1'))
    expect(status.winner).toBeNull()
  })

  it('names the winner of a checkmate', () => {
    expect(positionStatus(parseFen('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1'))).toEqual({
      outcome: 'checkmate',
      turn: BLACK,
      inCheck: true,
      checkSquare: sq('h8'),
      winner: WHITE,
      drawReason: null,
    })
    expect(positionStatus(parseFen('4R1k1/5ppp/8/8/8/8/8/6K1 b - - 0 1'))).toMatchObject({
      outcome: 'checkmate',
      turn: BLACK,
      checkSquare: sq('g8'),
      winner: WHITE,
    })
    expect(positionStatus(parseFen('8/8/8/8/8/6k1/6q1/7K w - - 0 1'))).toEqual({
      outcome: 'checkmate',
      turn: WHITE,
      inCheck: true,
      checkSquare: sq('h1'),
      winner: BLACK,
      drawReason: null,
    })
  })

  it('calls a stuck safe king stalemate', () => {
    expect(positionStatus(parseFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))).toEqual({
      outcome: 'stalemate',
      turn: BLACK,
      inCheck: false,
      checkSquare: NO_SQUARE,
      winner: null,
      drawReason: null,
    })
    expect(positionStatus(parseFen('8/8/8/8/8/1q6/2k5/K7 w - - 0 1'))).toMatchObject({
      outcome: 'stalemate',
      turn: WHITE,
      inCheck: false,
      winner: null,
    })
  })

  it('draws two bare kings for lack of material', () => {
    const status = positionStatus(parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1'))
    expect(status.outcome).toBe('draw')
    expect(status.drawReason).toBe('insufficient-material')
    expect(status.inCheck).toBe(false)
    expect(status.winner).toBeNull()
  })
})
