import { describe, expect, it } from 'vitest'
import { NO_SQUARE, algebraicToSquare, squareToAlgebraic } from './board'
import { START_FEN } from './fen'
import { StubGame, createDemoGame } from './stubGame'
import type { Move } from './types'
import { BLACK, EMPTY, KNIGHT, QUEEN, WHITE, isCapture, isPromotion, makePiece } from './types'

const sq = algebraicToSquare
const destinations = (moves: Move[]): string[] => moves.map((m) => squareToAlgebraic(m.to)).sort()

describe('StubGame as a GameApi', () => {
  it('starts from the standard position', () => {
    const game = new StubGame()
    expect(game.fen()).toBe(START_FEN)
    expect(game.turn()).toBe(WHITE)
    expect(game.history()).toEqual([])
    expect(game.lastMove()).toBeNull()
  })

  it('accepts a custom starting FEN', () => {
    const fen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'
    expect(new StubGame(fen).fen()).toBe(fen)
  })

  it('offers the real opening moves for pieces on their home squares', () => {
    const game = new StubGame()
    expect(destinations(game.legalMovesFrom(sq('e2')))).toEqual(['e3', 'e4'])
    expect(destinations(game.legalMovesFrom(sq('g1')))).toEqual(['f3', 'h3'])
  })

  it('offers all 20 real opening moves for white', () => {
    expect(new StubGame().legalMoves()).toHaveLength(20)
  })

  it('offers nothing for an empty square or an enemy piece', () => {
    const game = new StubGame()
    expect(game.legalMovesFrom(sq('e4'))).toEqual([])
    expect(game.legalMovesFrom(sq('e7'))).toEqual([])
  })

  it('does not apply the home-square table to the wrong piece type', () => {
    // A queen on e2 must not be offered the e-pawn's two-square advance.
    const game = new StubGame('4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1')
    expect(destinations(game.legalMovesFrom(sq('e2')))).not.toContain('e4')
  })

  it('does not hand a white pawn on e7 the black e-pawn opening moves', () => {
    const game = new StubGame('7k/4P3/8/8/8/8/8/4K3 w - - 0 1')
    expect(destinations(game.legalMovesFrom(sq('e7')))).not.toContain('e5')
  })

  it('falls back to king-steps away from home squares', () => {
    const game = new StubGame('4k3/8/8/8/4Q3/8/8/4K3 w - - 0 1')
    expect(destinations(game.legalMovesFrom(sq('e4')))).toEqual([
      'd3',
      'd4',
      'd5',
      'e3',
      'e5',
      'f3',
      'f4',
      'f5',
    ])
  })

  it('marks captures and will not step onto its own pieces', () => {
    const game = new StubGame('4k3/8/8/8/3pP3/4P3/8/4K3 w - - 0 1')
    const moves = game.legalMovesFrom(sq('e4'))
    const capture = moves.find((m) => m.to === sq('d4'))

    expect(capture).toBeDefined()
    expect(isCapture(capture!)).toBe(true)
    expect(destinations(moves)).not.toContain('e3')
  })

  it('flags a pawn reaching the last rank as a promotion', () => {
    const game = new StubGame('7k/4P3/8/8/8/8/8/4K3 w - - 0 1')
    const move = game.legalMovesFrom(sq('e7')).find((m) => m.to === sq('e8'))
    expect(move).toBeDefined()
    expect(isPromotion(move!)).toBe(true)
  })
})

describe('playing moves', () => {
  it('rejects a move that is not offered', () => {
    const game = new StubGame()
    expect(game.move(sq('e2'), sq('e5'))).toBeNull()
    expect(game.fen()).toBe(START_FEN)
  })

  it('moves the piece and passes the turn', () => {
    const game = new StubGame()
    expect(game.move(sq('e2'), sq('e4'))).not.toBeNull()

    expect(game.position().board[sq('e2')]).toBe(EMPTY)
    expect(game.position().board[sq('e4')]).toBe(makePiece(WHITE, 1))
    expect(game.turn()).toBe(BLACK)
  })

  it('sets the en passant square behind a double push', () => {
    const game = new StubGame()
    game.move(sq('e2'), sq('e4'))
    expect(game.position().epSquare).toBe(sq('e3'))
  })

  it('clears the en passant square after a quiet move', () => {
    const game = new StubGame()
    game.move(sq('e2'), sq('e4'))
    game.move(sq('b8'), sq('c6'))
    expect(game.position().epSquare).toBe(NO_SQUARE)
  })

  it('resets the halfmove clock on a pawn move and increments it otherwise', () => {
    const game = new StubGame()
    game.move(sq('g1'), sq('f3'))
    expect(game.position().halfmoveClock).toBe(1)

    game.move(sq('d7'), sq('d6'))
    expect(game.position().halfmoveClock).toBe(0)
  })

  it('increments the fullmove number only after black moves', () => {
    const game = new StubGame()
    game.move(sq('e2'), sq('e4'))
    expect(game.position().fullmoveNumber).toBe(1)

    game.move(sq('e7'), sq('e5'))
    expect(game.position().fullmoveNumber).toBe(2)
  })

  it('records history and the last move', () => {
    const game = new StubGame()
    game.move(sq('e2'), sq('e4'))

    expect(game.history()).toHaveLength(1)
    expect(game.history()[0].san).toBe('e4')
    expect(game.lastMove()?.to).toBe(sq('e4'))
  })

  it('promotes when a promotion piece is supplied', () => {
    const game = new StubGame('7k/4P3/8/8/8/8/8/4K3 w - - 0 1')
    game.move(sq('e7'), sq('e8'), QUEEN)
    expect(game.position().board[sq('e8')]).toBe(makePiece(WHITE, QUEEN))
  })
})

describe('undo and redo', () => {
  it('has nothing to undo at the start', () => {
    const game = new StubGame()
    expect(game.canUndo()).toBe(false)
    expect(game.canRedo()).toBe(false)
    expect(game.undo()).toBe(false)
  })

  it('steps backwards and forwards through the game', () => {
    const game = new StubGame()
    game.move(sq('e2'), sq('e4'))

    expect(game.undo()).toBe(true)
    expect(game.fen()).toBe(START_FEN)
    expect(game.history()).toEqual([])
    expect(game.canRedo()).toBe(true)

    expect(game.redo()).toBe(true)
    expect(game.position().board[sq('e4')]).toBe(makePiece(WHITE, 1))
    expect(game.history()).toHaveLength(1)
  })

  it('discards the undone moves once a new move is played', () => {
    const game = new StubGame()
    game.move(sq('e2'), sq('e4'))
    game.undo()
    game.move(sq('d2'), sq('d4'))

    expect(game.canRedo()).toBe(false)
    expect(game.history()).toHaveLength(1)
    expect(game.history()[0].san).toBe('d4')
  })

  it('resets back to a fresh game', () => {
    const game = new StubGame()
    game.move(sq('e2'), sq('e4'))
    game.reset()

    expect(game.fen()).toBe(START_FEN)
    expect(game.canUndo()).toBe(false)
    expect(game.history()).toEqual([])
  })
})

describe('status', () => {
  it('reports a playing game by default', () => {
    expect(new StubGame().status()).toEqual({
      outcome: 'playing',
      turn: WHITE,
      inCheck: false,
      checkSquare: NO_SQUARE,
      winner: null,
      drawReason: null,
    })
  })

  it('can be forced so every game-over visual can be previewed', () => {
    const game = new StubGame()
    game.forceStatus({ outcome: 'checkmate', winner: WHITE })
    expect(game.status().outcome).toBe('checkmate')
    expect(game.status().winner).toBe(WHITE)

    game.forceStatus({ outcome: 'draw', drawReason: 'threefold-repetition' })
    expect(game.status().drawReason).toBe('threefold-repetition')

    game.forceStatus(null)
    expect(game.status().outcome).toBe('playing')
  })
})

describe('createDemoGame', () => {
  it('produces the Ruy Lopez position after six moves', () => {
    expect(createDemoGame().fen()).toBe(
      'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    )
  })

  it('gives the move list realistic content', () => {
    const history = createDemoGame().history()
    expect(history.map((record) => record.san)).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'])
  })

  it('records a reachable position for every move', () => {
    for (const record of createDemoGame().history()) {
      expect(record.fen).toMatch(/^[1-8rnbqkpRNBQKP/]+ [wb] /)
    }
  })

  it('leaves the knight where the notation says it went', () => {
    const game = createDemoGame()
    expect(game.position().board[sq('f3')]).toBe(makePiece(WHITE, KNIGHT))
    expect(game.position().board[sq('g1')]).toBe(EMPTY)
  })
})
