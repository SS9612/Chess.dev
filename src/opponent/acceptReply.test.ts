import { describe, expect, it } from 'vitest'
import { Game } from '../engine/game'
import { acceptReply } from './acceptReply'

describe('acceptReply', () => {
  it('plays a legal move, including one wrapped in a sentence', () => {
    const game = new Game()
    expect(acceptReply(game, 'Nf3')).toBe('Nf3')
    expect(game.history().map((record) => record.san)).toEqual(['Nf3'])

    expect(acceptReply(game, 'I answer e5.')).toBe('e5')
    expect(game.history().map((record) => record.san)).toEqual(['Nf3', 'e5'])
  })

  it('accepts a check mark and lowercase piece letters', () => {
    const game = new Game()
    expect(acceptReply(game, 'e4+')).toBe('e4')
    expect(acceptReply(game, 'nf6')).toBe('Nf6')
    expect(game.history().map((record) => record.san)).toEqual(['e4', 'Nf6'])
  })

  it('plays castling written with zeros', () => {
    const game = new Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
    expect(acceptReply(game, '0-0')).toBe('O-O')
    expect(game.fen()).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1')
  })

  it('plays the named promotion', () => {
    const game = new Game('8/P7/4k3/8/8/8/8/4K3 w - - 0 1')
    expect(acceptReply(game, 'a8=N')).toBe('a8=N')
    expect(game.fen()).toContain('N7/')
  })

  it('replaces an illegal or unreadable reply with a legal move', () => {
    const illegal = new Game()
    const played = acceptReply(illegal, 'Qh5')
    expect(['e4', 'd4', 'c4', 'Nf3', 'Nc3']).toContain(played)
    expect(illegal.history().map((record) => record.san)).toEqual([played])

    const unreadable = new Game()
    expect(acceptReply(unreadable, 'somewhere safe')).toBe(played)
    expect(unreadable.fen()).toBe(illegal.fen())
  })

  it('leaves a finished game unchanged', () => {
    const game = new Game('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
    const fen = game.fen()
    expect(acceptReply(game, 'e4')).toBeNull()
    expect(game.fen()).toBe(fen)
    expect(game.history()).toEqual([])
  })
})
