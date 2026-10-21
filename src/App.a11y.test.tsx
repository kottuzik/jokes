import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

const fetchMock = vi.fn<typeof fetch>()

// jsdom cannot compute colors, so contrast is checked in a real browser instead
async function violations() {
  const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })
}

async function setupWithJoke() {
  const user = userEvent.setup()
  render(<App />)
  fetchMock.mockResolvedValueOnce(Response.json({ joke: 'בדיחה ראשונה.', language: 'he' }))
  await user.click(screen.getByRole('button', { name: 'צור בדיחה' }))
  await screen.findByText('בדיחה ראשונה.')
  return user
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  setOnline(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
  setOnline(true)
})

describe('Accessibility (axe)', () => {
  it('has no violations on the initial screen', async () => {
    render(<App />)
    expect(await violations()).toEqual([])
  })

  it('has no violations with jokes in the list', async () => {
    await setupWithJoke()
    expect(await violations()).toEqual([])
  })

  it('has no violations while loading', async () => {
    fetchMock.mockReturnValueOnce(new Promise(() => {}))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'צור בדיחה' }))
    expect(await violations()).toEqual([])
  })

  it('has no violations with an error', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: 'GENERATION_FAILED' }, { status: 502 }))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'צור בדיחה' }))
    await screen.findByRole('button', { name: 'נסו שוב' })
    expect(await violations()).toEqual([])
  })

  it('has no violations offline', async () => {
    setOnline(false)
    render(<App />)
    expect(await violations()).toEqual([])
  })

  it('has no violations with the delete dialog open', async () => {
    const user = await setupWithJoke()
    await user.click(screen.getByRole('button', { name: 'ניקוי בדיחות' }))
    await act(async () => {})
    expect(await violations()).toEqual([])
  })
})
