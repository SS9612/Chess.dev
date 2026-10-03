import { describe, expect, it } from 'vitest'
import { algebraicToSquare, squareToAlgebraic } from '../engine/board'
import { START_FEN } from '../engine/fen'
import { Game } from '../engine/game'
import { StubGame } from '../engine/stubGame'
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
