import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

const OFFLINE = 'אין חיבור לאינטרנט. כדי ליצור בדיחה יש להתחבר לרשת.'
const ERROR = 'לא הצלחנו ליצור בדיחה. נסו שוב.'

const fetchMock = vi.fn<typeof fetch>()

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })
}

// Changes the reported state and fires the matching browser event
function goOnline(online: boolean) {
  act(() => {
    setOnline(online)
    window.dispatchEvent(new Event(online ? 'online' : 'offline'))
  })
}

function setup() {
  const user = userEvent.setup()
  render(<App />)
  return {
    user,
    input: screen.getByRole('textbox', { name: 'בחר נושא לבדיחה' }),
    button: screen.getByRole('button', { name: 'צור בדיחה' }),
    list: screen.getByRole('list', { name: 'רשימת בדיחות' }),
  }
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

describe('Offline', () => {
  it('opens offline with the message, a disabled button and no AI request', async () => {
    setOnline(false)
    const { user, input, button } = setup()

    expect(screen.getByRole('status')).toHaveTextContent(OFFLINE)
    expect(button).toBeDisabled()

    // The field still works, but Enter sends nothing
    await user.type(input, 'חתולים{Enter}')
    expect(input).toHaveValue('חתולים')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the message on disconnect and allows generating again on reconnect', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ joke: 'בדיחה ראשונה.', language: 'he' }))
    const { user, button, list } = setup()
    expect(screen.queryByText(OFFLINE)).not.toBeInTheDocument()

    goOnline(false)
    expect(screen.getByRole('status')).toHaveTextContent(OFFLINE)
    expect(button).toBeDisabled()

    goOnline(true)
    expect(screen.queryByText(OFFLINE)).not.toBeInTheDocument()
    expect(button).toBeEnabled()
    await user.click(button)
    expect(await within(list).findByText('בדיחה ראשונה.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps existing jokes while offline', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ joke: 'בדיחה ראשונה.', language: 'he' }))
    const { user, button, list } = setup()
    await user.click(button)
    await within(list).findByText('בדיחה ראשונה.')

    goOnline(false)
    expect(within(list).getByText('בדיחה ראשונה.')).toBeInTheDocument()
    goOnline(true)
    expect(within(list).getByText('בדיחה ראשונה.')).toBeInTheDocument()
  })

  it('hides retry while offline and resends the same request once back online', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ error: 'GENERATION_FAILED' }, { status: 502 }))
      .mockResolvedValueOnce(Response.json({ joke: 'A cat joke.', language: 'en' }))
    const { user, input, button, list } = setup()
    await user.type(input, 'cats')
    await user.click(button)
    expect(await screen.findByText(ERROR)).toBeInTheDocument()

    goOnline(false)
    expect(screen.queryByRole('button', { name: 'נסו שוב' })).not.toBeInTheDocument()
    expect(screen.queryByText(ERROR)).not.toBeInTheDocument()

    goOnline(true)
    await user.click(screen.getByRole('button', { name: 'נסו שוב' }))
    expect(await within(list).findByText('A cat joke.')).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string).topic).toBe('cats')
  })
})
