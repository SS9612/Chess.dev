import { describe, expect, it } from 'vitest'
import type { GameStatus } from '../engine/gameApi.ts'
import { BLACK, WHITE } from '../engine/types.ts'
import { gameOverCopy } from './gameOverCopy.ts'

function status(partial: Partial<GameStatus>): GameStatus {
  return {
    outcome: 'playing',
    turn: WHITE,
    inCheck: false,
    checkSquare: -1,
    winner: null,
    drawReason: null,
    ...partial,
  }
}

describe('gameOverCopy', () => {
  it('says nothing while the game is in progress', () => {
    expect(gameOverCopy(status({}))).toBeNull()
  })

  it('names the winner of a checkmate', () => {
    expect(gameOverCopy(status({ outcome: 'checkmate', winner: WHITE }))).toEqual({
      title: 'Checkmate',
      detail: 'White wins',
    })
    expect(gameOverCopy(status({ outcome: 'checkmate', winner: BLACK })).detail).toBe('Black wins')
  })

  it('calls stalemate a draw', () => {
    expect(gameOverCopy(status({ outcome: 'stalemate' }))).toEqual({
      title: 'Stalemate',
      detail: 'Draw',
    })
  })

  it('names each draw reason', () => {
    expect(
      gameOverCopy(status({ outcome: 'draw', drawReason: 'fifty-move' })).detail,
    ).toBe('Fifty-move rule')
    expect(
      gameOverCopy(status({ outcome: 'draw', drawReason: 'threefold-repetition' })).detail,
    ).toBe('Threefold repetition')
    expect(
      gameOverCopy(status({ outcome: 'draw', drawReason: 'insufficient-material' })).detail,
    ).toBe('Insufficient material')
  })
})
