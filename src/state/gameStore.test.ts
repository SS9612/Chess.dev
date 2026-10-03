import { describe, expect, it, vi } from 'vitest'
import { algebraicToSquare, squareToAlgebraic } from '../engine/board'
import { START_FEN } from '../engine/fen'
import { Game } from '../engine/game'
import { StubGame } from '../engine/stubGame'
import type { MoveContext } from '../opponent/context'
import { BLACK, EMPTY, QUEEN, WHITE, makePiece } from '../engine/types'
import { createGameStore } from './gameStore'

const sq = algebraicToSquare

function playing() {
  const game = new StubGame()
  return { game, store: createGameStore(game) }
}

describe('snapshot', () => {
  it('starts at the initial position with nothing selected', () => {
    const { store } = playing()
    const snapshot = store.getSnapshot()

    expect(snapshot.fen).toBe(START_FEN)
    expect(snapshot.turn).toBe(WHITE)
    expect(snapshot.selected).toBeNull()
    expect(snapshot.movesFromSelection).toEqual([])
    expect(snapshot.pendingPromotion).toBeNull()
    expect(snapshot.history).toEqual([])
    expect(snapshot.lastMove).toBeNull()
    expect(snapshot.canUndo).toBe(false)
    expect(snapshot.canRedo).toBe(false)
    expect(snapshot.status.outcome).toBe('playing')
  })

  it('returns the same snapshot object until something changes', () => {
    const { store } = playing()
    expect(store.getSnapshot()).toBe(store.getSnapshot())
  })

  it('notifies subscribers on a change and not after they unsubscribe', () => {
    const { store } = playing()
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)

    store.chooseSquare(sq('e2'))
    expect(calls).toBe(1)

    unsubscribe()
    store.chooseSquare(sq('e2'))
    expect(calls).toBe(1)
  })

  it('does not notify when a click changes nothing', () => {
    const { store } = playing()
    let calls = 0
    store.subscribe(() => calls++)

    store.chooseSquare(sq('e4'))
    expect(calls).toBe(0)
    expect(store.getSnapshot()).toBe(store.getSnapshot())
  })
})

describe('selection', () => {
  it('selects a piece of the side to move and lists its moves', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))

    const snapshot = store.getSnapshot()
    expect(snapshot.selected).toBe(sq('e2'))
    expect(snapshot.movesFromSelection.map((move) => move.to).sort()).toEqual([sq('e3'), sq('e4')])
  })

  it('will not select an empty square or an enemy piece', () => {
    const { store } = playing()
    store.chooseSquare(sq('e7'))
    expect(store.getSnapshot().selected).toBeNull()
  })

  it('clears the selection when the same square is clicked again', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e2'))
    expect(store.getSnapshot().selected).toBeNull()
  })

  it('switches the selection to another piece of the same side', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('g1'))
    expect(store.getSnapshot().selected).toBe(sq('g1'))
  })

  it('clears the selection when an illegal square is clicked', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e5'))
    expect(store.getSnapshot().selected).toBeNull()
    expect(store.getSnapshot().fen).toBe(START_FEN)
  })
})

describe('moves', () => {
  it('plays a move when a highlighted destination is clicked', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))

    const snapshot = store.getSnapshot()
    expect(snapshot.position.board[sq('e4')]).toBe(makePiece(WHITE, 1))
    expect(snapshot.position.board[sq('e2')]).toBe(EMPTY)
    expect(snapshot.turn).toBe(BLACK)
    expect(snapshot.selected).toBeNull()
    expect(snapshot.history).toHaveLength(1)
    expect(snapshot.lastMove?.to).toBe(sq('e4'))
    expect(snapshot.canUndo).toBe(true)
  })

  it('holds a promotion until a piece is chosen', () => {
    const game = new StubGame('7k/4P3/8/8/8/8/8/4K3 w - - 0 1')
    const store = createGameStore(game)

    store.chooseSquare(sq('e7'))
    store.chooseSquare(sq('e8'))

    expect(store.getSnapshot().pendingPromotion).toEqual({ from: sq('e7'), to: sq('e8') })
    expect(store.getSnapshot().position.board[sq('e7')]).toBe(makePiece(WHITE, 1))

    store.confirmPromotion(QUEEN)
    expect(store.getSnapshot().position.board[sq('e8')]).toBe(makePiece(WHITE, QUEEN))
    expect(store.getSnapshot().pendingPromotion).toBeNull()
    expect(store.getSnapshot().selected).toBeNull()
  })

  it('drops a pending promotion when it is cancelled', () => {
    const game = new StubGame('7k/4P3/8/8/8/8/8/4K3 w - - 0 1')
    const store = createGameStore(game)
    store.chooseSquare(sq('e7'))
    store.chooseSquare(sq('e8'))

    store.cancelPromotion()
    expect(store.getSnapshot().pendingPromotion).toBeNull()
    expect(store.getSnapshot().selected).toBe(sq('e7'))
    expect(store.getSnapshot().position.board[sq('e7')]).toBe(makePiece(WHITE, 1))
  })

  it('does nothing when confirming and nothing is pending', () => {
    const { store } = playing()
    const before = store.getSnapshot()
    store.confirmPromotion(QUEEN)
    expect(store.getSnapshot()).toBe(before)
  })

  it('refuses to move once the game is over', () => {
    const { game, store } = playing()
    game.forceStatus({ outcome: 'checkmate', winner: BLACK })
    const before = store.getSnapshot()

    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))

    expect(store.getSnapshot()).toBe(before)
    expect(store.getSnapshot().fen).toBe(START_FEN)
  })
})

describe('history controls', () => {
  it('undoes a move and clears the selection', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))
    store.chooseSquare(sq('e7'))

    store.undo()
    const snapshot = store.getSnapshot()
    expect(snapshot.fen).toBe(START_FEN)
    expect(snapshot.selected).toBeNull()
    expect(snapshot.canRedo).toBe(true)
    expect(snapshot.history).toEqual([])
  })

  it('redoes a move that was undone', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))
    store.undo()
    store.redo()

    expect(store.getSnapshot().position.board[sq('e4')]).toBe(makePiece(WHITE, 1))
    expect(store.getSnapshot().turn).toBe(BLACK)
  })

  it('does not notify when there is nothing to undo', () => {
    const { store } = playing()
    const before = store.getSnapshot()
    let calls = 0
    store.subscribe(() => calls++)

    store.undo()
    store.redo()
    expect(calls).toBe(0)
    expect(store.getSnapshot()).toBe(before)
  })

  it('resets to the starting position', () => {
    const { store } = playing()
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))
    store.reset()

    expect(store.getSnapshot().fen).toBe(START_FEN)
    expect(store.getSnapshot().canUndo).toBe(false)
    expect(store.getSnapshot().selected).toBeNull()
  })

  it('resets to a given position', () => {
    const { store } = playing()
    const fen = '4k3/8/8/8/8/8/8/4K3 b - - 0 1'
    store.reset(fen)
    expect(store.getSnapshot().fen).toBe(fen)
    expect(store.getSnapshot().turn).toBe(BLACK)
  })
})

describe('real rules through the store', () => {
  it('keeps moving a knight like a knight after it leaves home', () => {
    const store = createGameStore(new Game())
    store.chooseSquare(sq('g1'))
    store.chooseSquare(sq('f3'))
    store.chooseSquare(sq('f3'))
    expect(store.getSnapshot().selected).toBeNull()

    store.chooseSquare(sq('e7'))
    store.chooseSquare(sq('e5'))
    store.chooseSquare(sq('f3'))

    const destinations = store
      .getSnapshot()
      .movesFromSelection.map((move) => squareToAlgebraic(move.to))
      .sort()
    expect(destinations).toEqual(['d4', 'e5', 'g1', 'g5', 'h4'])
    expect(store.getSnapshot().history.map((record) => record.san)).toEqual(['Nf3', 'e5'])
  })

  it('promotes through the dialog with the real piece', () => {
    const store = createGameStore(new Game('7k/4P3/8/8/8/8/8/4K3 w - - 0 1'))
    store.chooseSquare(sq('e7'))
    store.chooseSquare(sq('e8'))
    expect(store.getSnapshot().pendingPromotion).toEqual({ from: sq('e7'), to: sq('e8') })

    store.confirmPromotion(QUEEN)
    expect(store.getSnapshot().position.board[sq('e8')]).toBe(makePiece(WHITE, QUEEN))
    expect(store.getSnapshot().history[0].san).toBe('e8=Q+')
  })
})

describe('finished games', () => {
  function click(store: ReturnType<typeof createGameStore>, from: string, to: string) {
    store.chooseSquare(sq(from))
    store.chooseSquare(sq(to))
  }

  it('shows check while the game can still be played', () => {
    const store = createGameStore(new Game())
    click(store, 'e2', 'e4')
    click(store, 'f7', 'f5')
    click(store, 'd1', 'h5')

    const status = store.getSnapshot().status
    expect(status.outcome).toBe('playing')
    expect(status.inCheck).toBe(true)
    expect(status.checkSquare).toBe(sq('e8'))
    expect(store.getSnapshot().history.map((record) => record.san)).toEqual(['e4', 'f5', 'Qh5+'])
  })

  it('stops the game on checkmate and ignores further piece clicks', () => {
    const store = createGameStore(new Game())
    click(store, 'f2', 'f3')
    click(store, 'e7', 'e5')
    click(store, 'g2', 'g4')
    click(store, 'd8', 'h4')

    const finished = store.getSnapshot()
    expect(finished.status).toMatchObject({
      outcome: 'checkmate',
      inCheck: true,
      checkSquare: sq('e1'),
      winner: BLACK,
      drawReason: null,
    })
    expect(finished.history.at(-1)?.san).toBe('Qh4#')

    store.chooseSquare(sq('a7'))
    store.chooseSquare(sq('a6'))
    expect(store.getSnapshot().fen).toBe(finished.fen)
    expect(store.getSnapshot().selected).toBeNull()
  })

  it('stops the game on stalemate', () => {
    const store = createGameStore(new Game('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))
    const finished = store.getSnapshot()
    expect(finished.status.outcome).toBe('stalemate')
    expect(finished.status.drawReason).toBeNull()

    store.chooseSquare(sq('h8'))
    expect(store.getSnapshot().selected).toBeNull()
    expect(store.getSnapshot().fen).toBe(finished.fen)
  })

  it('names a draw by insufficient material', () => {
    const store = createGameStore(new Game('4k3/8/8/8/8/8/8/4K3 w - - 0 1'))
    expect(store.getSnapshot().status).toMatchObject({
      outcome: 'draw',
      drawReason: 'insufficient-material',
    })

    store.chooseSquare(sq('e1'))
    store.chooseSquare(sq('e2'))
    expect(store.getSnapshot().selected).toBeNull()
    expect(store.getSnapshot().history).toEqual([])
  })
})

describe('computer reply', () => {
  it('answers as black after white moves', async () => {
    const store = createGameStore(new Game(), {
      chooseMove: async () => 'e5',
    })
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))

    expect(store.getSnapshot().thinking).toBe(true)
    expect(store.getSnapshot().history.map((record) => record.san)).toEqual(['e4'])

    await Promise.resolve()
    const after = store.getSnapshot()
    expect(after.thinking).toBe(false)
    expect(after.history.map((record) => record.san)).toEqual(['e4', 'e5'])
    expect(after.turn).toBe(WHITE)

    store.chooseSquare(sq('e7'))
    expect(store.getSnapshot().selected).toBeNull()
  })

  it('sends the selected difficulty with the legal moves', async () => {
    const seen: MoveContext[] = []
    const store = createGameStore(new Game(), {
      chooseMove: async (context) => {
        seen.push(context)
        return 'Nc6'
      },
    })
    store.setDifficulty('hard')
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))
    await Promise.resolve()

    expect(seen).toHaveLength(1)
    expect(seen[0].difficulty).toBe('hard')
    expect(seen[0].history).toEqual(['e4'])
    expect(seen[0].legalMoves).toContain('Nc6')
    expect(store.getSnapshot().history.map((record) => record.san)).toEqual(['e4', 'Nc6'])
  })

  it('replaces an illegal reply with a legal one', async () => {
    const store = createGameStore(new Game(), {
      chooseMove: async () => 'Qh5',
    })
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))
    await Promise.resolve()
    const history = store.getSnapshot().history.map((record) => record.san)
    expect(history[0]).toBe('e4')
    expect(['d5', 'e5', 'c5', 'Nf6', 'Nc6']).toContain(history[1])
  })

  it('does not reply when the move ends the game', async () => {
    let calls = 0
    const store = createGameStore(new Game('7k/Q7/6K1/8/8/8/8/8 w - - 0 1'), {
      chooseMove: async () => {
        calls += 1
        return 'a6'
      },
    })
    store.chooseSquare(sq('a7'))
    store.chooseSquare(sq('g7'))
    await Promise.resolve()
    expect(calls).toBe(0)
    expect(store.getSnapshot().status.outcome).toBe('checkmate')
    expect(store.getSnapshot().history.map((record) => record.san)).toEqual(['Qg7#'])
  })

  it('drops a reply that arrives after undo', async () => {
    let release: (move: string) => void = () => {}
    const store = createGameStore(new Game(), {
      chooseMove: () =>
        new Promise((resolve) => {
          release = resolve
        }),
    })
    store.chooseSquare(sq('e2'))
    store.chooseSquare(sq('e4'))
    expect(store.getSnapshot().thinking).toBe(true)

    store.undo()
    expect(store.getSnapshot().thinking).toBe(false)
    expect(store.getSnapshot().fen).toBe(START_FEN)

    release('e5')
    await Promise.resolve()
    expect(store.getSnapshot().fen).toBe(START_FEN)
    expect(store.getSnapshot().history).toEqual([])
  })

  it('keeps a short thinking pause only when the reply is faster than pauseMs', async () => {
    vi.useFakeTimers()
    try {
      const store = createGameStore(new Game(), {
        chooseMove: async () => 'e5',
        pauseMs: 400,
      })
      store.chooseSquare(sq('e2'))
      store.chooseSquare(sq('e4'))
      expect(store.getSnapshot().thinking).toBe(true)

      await Promise.resolve()
      expect(store.getSnapshot().thinking).toBe(true)
      expect(store.getSnapshot().history.map((record) => record.san)).toEqual(['e4'])

      await vi.advanceTimersByTimeAsync(399)
      expect(store.getSnapshot().thinking).toBe(true)

      await vi.advanceTimersByTimeAsync(1)
      expect(store.getSnapshot().thinking).toBe(false)
      expect(store.getSnapshot().history.map((record) => record.san)).toEqual(['e4', 'e5'])
    } finally {
      vi.useRealTimers()
    }
  })
})
