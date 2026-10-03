import { afterEach, describe, expect, it, vi } from 'vitest'
import { algebraicToSquare } from '../engine/board'
import { Game } from '../engine/game'
import { chooseMove, fallbackMove } from './chooseMove'
import { buildMoveContext } from './context'

const sq = algebraicToSquare

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockChat(content: string, ok = true): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok,
      json: async () => ({ message: { content } }),
    })),
  )
}

describe('chooseMove', () => {
  it('asks Ollama with the difficulty instructions and the legal moves', async () => {
    mockChat('e5')
    const game = new Game()
    game.move(sq('e2'), sq('e4'))

    const easy = buildMoveContext(game, 'easy')
    const hard = buildMoveContext(game, 'hard')
    expect(await chooseMove(easy)).toBe('e5')
    expect(await chooseMove(hard)).toBe('e5')

    const calls = vi.mocked(fetch).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0]).toBe('/api/ollama/api/chat')

    const easyBody = JSON.parse(String(calls[0][1]?.body))
    const hardBody = JSON.parse(String(calls[1][1]?.body))
    expect(easyBody.stream).toBe(false)
    expect(easyBody.messages[1].content).toContain(easy.instructions)
    expect(easyBody.messages[1].content).toContain('Candidates (stronger first):')
    expect(hardBody.messages[1].content).toContain('Candidates (stronger first):')
    expect(hardBody.messages[1].content).toContain('e5')
    expect(hardBody.messages[1].content).toContain(hard.instructions)
    expect(easyBody.messages[1].content).not.toBe(hardBody.messages[1].content)
    // Hard only offers the top candidates; easy offers the quieter half.
    expect(hardBody.messages[1].content).toMatch(/Candidates \(stronger first\): (c5|d5|e5)/)
    const hardCandidates = /Candidates \(stronger first\): (.+)/.exec(hardBody.messages[1].content)?.[1] ?? ''
    expect(hardCandidates.split(', ')).toHaveLength(12)
  })

  it('returns a refuseable string when Ollama fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))

    const reply = await chooseMove(buildMoveContext(new Game(), 'medium'))
    expect(reply).toBe('???')
  })

  it('returns nothing when the position has no legal move', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    expect(await chooseMove(buildMoveContext(new Game('4k3/8/8/8/8/8/8/4K3 w - - 0 1'), 'easy'))).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('fallbackMove', () => {
  it('prefers the highest-ranked legal move', () => {
    expect(fallbackMove(['a3', 'e4', 'h3'])).toBe('e4')
    expect(fallbackMove(['Kd1', 'Nxe5', 'a3'])).toBe('Nxe5')
    expect(fallbackMove([])).toBeNull()
  })
})
