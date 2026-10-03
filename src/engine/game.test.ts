import { describe, expect, it } from 'vitest'
import { algebraicToSquare } from './board'
import { START_FEN } from './fen'
import { Game } from './game'
import { BLACK, QUEEN, WHITE, makePiece } from './types'

const sq = algebraicToSquare

const ITALIAN = [
  ['e2', 'e4', 'e4'],
  ['e7', 'e5', 'e5'],
  ['g1', 'f3', 'Nf3'],
  ['b8', 'c6', 'Nc6'],
  ['f1', 'c4', 'Bc4'],
  ['f8', 'c5', 'Bc5'],
] as const

describe('Game', () => {
  it('plays the Italian game to its known position', () => {
    const game = new Game()
    for (const [from, to, san] of ITALIAN) {
      const move = game.move(sq(from), sq(to))
      expect(move).not.toBeNull()
      expect(game.history().at(-1)?.san).toBe(san)
      expect(game.history().at(-1)?.fen).toBe(game.fen())
    }

    expect(game.fen()).toBe('r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4')
    expect(game.turn()).toBe(WHITE)
    expect(game.status().outcome).toBe('playing')
    expect(game.legalMoves().length).toBeGreaterThan(0)
    expect(game.history().map((record) => record.san)).toEqual(ITALIAN.map(([, , san]) => san))
  })

  it('rejects an illegal move and a promotion with no piece', () => {
    const game = new Game()
    expect(game.move(sq('e2'), sq('e5'))).toBeNull()
    expect(game.fen()).toBe(START_FEN)

    const promoting = new Game('7k/4P3/8/8/8/8/8/4K3 w - - 0 1')
    expect(promoting.move(sq('e7'), sq('e8'))).toBeNull()
    expect(promoting.fen()).toBe('7k/4P3/8/8/8/8/8/4K3 w - - 0 1')

    expect(promoting.move(sq('e7'), sq('e8'), QUEEN)?.promotion).toBe(QUEEN)
    expect(promoting.position().board[sq('e8')]).toBe(makePiece(WHITE, QUEEN))
    expect(promoting.history()[0].san).toBe('e8=Q+')
  })

  it('ignores a promotion piece on a move that does not promote', () => {
    const game = new Game()
    expect(game.move(sq('e2'), sq('e4'), QUEEN)).not.toBeNull()
    expect(game.history()[0].san).toBe('e4')
  })

  it('mates, then refuses further moves until the mate is undone', () => {
    const game = new Game('7k/Q7/6K1/8/8/8/8/8 w - - 0 1')
    expect(game.move(sq('a7'), sq('g7'))).not.toBeNull()
    expect(game.history()[0].san).toBe('Qg7#')
    expect(game.status()).toMatchObject({
      outcome: 'checkmate',
      turn: BLACK,
      inCheck: true,
      winner: WHITE,
      drawReason: null,
    })
    expect(game.legalMoves()).toEqual([])
    expect(game.move(sq('h8'), sq('g8'))).toBeNull()

    expect(game.undo()).toBe(true)
    expect(game.status().outcome).toBe('playing')
    expect(game.redo()).toBe(true)
    expect(game.status().outcome).toBe('checkmate')
  })

  it('castles and captures en passant', () => {
    const castling = new Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
    castling.move(sq('e1'), sq('g1'))
    expect(castling.history()[0].san).toBe('O-O')
    expect(castling.fen()).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1')

    const passant = new Game('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
    passant.move(sq('e5'), sq('d6'))
    expect(passant.history()[0].san).toBe('exd6')
    expect(passant.fen()).toBe('4k3/8/3P4/8/8/8/8/4K3 b - - 0 1')
  })

  it('draws bare kings, the fifty-move rule, and a threefold repetition', () => {
    const bare = new Game('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
    expect(bare.status().drawReason).toBe('insufficient-material')
    expect(bare.legalMoves()).toEqual([])
    expect(bare.move(sq('e1'), sq('e2'))).toBeNull()

    const clock = new Game('4k3/8/8/8/8/8/8/4K2Q w - - 99 80')
    expect(clock.status().outcome).toBe('playing')
    clock.move(sq('h1'), sq('h2'))
    expect(clock.status().drawReason).toBe('fifty-move')

    const game = new Game()
    const cycle = [
      ['g1', 'f3'],
      ['g8', 'f6'],
      ['f3', 'g1'],
      ['f6', 'g8'],
    ] as const
    for (const [from, to] of cycle) game.move(sq(from), sq(to))
    expect(game.status().outcome).toBe('playing')
    for (const [from, to] of cycle) game.move(sq(from), sq(to))
    expect(game.status()).toMatchObject({ outcome: 'draw', drawReason: 'threefold-repetition' })
    expect(game.move(sq('g1'), sq('f3'))).toBeNull()
  })

  it('undoes, redoes, and drops the abandoned line', () => {
    const game = new Game()
    game.move(sq('e2'), sq('e4'))
    expect(game.undo()).toBe(true)
    expect(game.fen()).toBe(START_FEN)
    expect(game.history()).toEqual([])
    expect(game.lastMove()).toBeNull()

    expect(game.redo()).toBe(true)
    expect(game.lastMove()?.to).toBe(sq('e4'))

    game.undo()
    game.move(sq('d2'), sq('d4'))
    expect(game.canRedo()).toBe(false)
    expect(game.history().map((record) => record.san)).toEqual(['d4'])
  })

  it('resets to the starting position or a supplied one', () => {
    const game = new Game()
    game.move(sq('e2'), sq('e4'))
    game.reset()
    expect(game.fen()).toBe(START_FEN)
    expect(game.history()).toEqual([])
    expect(game.canUndo()).toBe(false)

    game.reset('4k3/8/8/8/8/8/8/4K3 b - - 0 1')
    expect(game.turn()).toBe(BLACK)
    expect(game.status().drawReason).toBe('insufficient-material')
  })
})
