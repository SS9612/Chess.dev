import { describe, expect, it } from 'vitest'
import { algebraicToSquare } from '../engine/board'
import { Game } from '../engine/game'
import { buildMoveContext, type Difficulty } from './context'

const sq = algebraicToSquare

const OPENING = [
  'Na3',
  'Nc3',
  'Nf3',
  'Nh3',
  'a3',
  'a4',
  'b3',
  'b4',
  'c3',
  'c4',
  'd3',
  'd4',
  'e3',
  'e4',
  'f3',
  'f4',
  'g3',
  'g4',
  'h3',
  'h4',
]

describe('buildMoveContext', () => {
  it('lists every legal opening move for each difficulty', () => {
    const game = new Game()
    const levels: Difficulty[] = ['easy', 'medium', 'hard']
    const contexts = levels.map((level) => buildMoveContext(game, level))

    for (const context of contexts) {
      expect(context.legalMoves).toEqual(OPENING)
      expect(context.fen).toBe(game.fen())
      expect(context.history).toEqual([])
    }
    expect(game.fen()).toBe(contexts[0].fen)
  })

  it('gives each difficulty different instructions', () => {
    const game = new Game()
    const easy = buildMoveContext(game, 'easy')
    const medium = buildMoveContext(game, 'medium')
    const hard = buildMoveContext(game, 'hard')

    expect(easy.difficulty).toBe('easy')
    expect(medium.difficulty).toBe('medium')
    expect(hard.difficulty).toBe('hard')
    expect(new Set([easy.instructions, medium.instructions, hard.instructions]).size).toBe(3)
  })

  it('includes the history and the side to move after moves have been played', () => {
    const game = new Game()
    game.move(sq('e2'), sq('e4'))
    game.move(sq('e7'), sq('e5'))

    const context = buildMoveContext(game, 'medium')
    expect(context.history).toEqual(['e4', 'e5'])
    expect(context.fen.startsWith('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w ')).toBe(true)
    expect(context.legalMoves).toContain('Nf3')
    expect(context.legalMoves).toContain('Bc4')
    expect(context.legalMoves).not.toContain('e5')
  })

  it('includes castling and promotion among the legal moves', () => {
    const castling = buildMoveContext(new Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'), 'hard')
    expect(castling.legalMoves).toEqual(expect.arrayContaining(['O-O', 'O-O-O']))

    const promotion = buildMoveContext(new Game('8/P7/4k3/8/8/8/8/4K3 w - - 0 1'), 'easy')
    expect(promotion.legalMoves).toEqual(expect.arrayContaining(['a8=Q', 'a8=R', 'a8=B', 'a8=N']))
  })

  it('includes an empty move list when the game is already over', () => {
    const context = buildMoveContext(new Game('4k3/8/8/8/8/8/8/4K3 w - - 0 1'), 'hard')
    expect(context.legalMoves).toEqual([])
    expect(context.instructions.length).toBeGreaterThan(0)
  })
})
