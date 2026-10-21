import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

const JOKES = ['בדיחה ראשונה.', 'בדיחה שנייה.', 'בדיחה שלישית.']
// Created in JOKES order; the newest is shown first
const SHOWN = [...JOKES].reverse()

const fetchMock = vi.fn<typeof fetch>()
const writeText = vi.fn<(text: string) => Promise<void>>()

function sentBody(callIndex: number) {
  return JSON.parse(fetchMock.mock.calls[callIndex][1]!.body as string)
}

// Renders the app and creates the given jokes through the (mocked) API
async function setupWithJokes(texts: string[] = JOKES) {
  const user = userEvent.setup()
  // userEvent installs its own clipboard; replace it with the spy afterwards
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
  render(<App />)
  const create = screen.getByRole('button', { name: 'צור בדיחה' })
  for (const text of texts) {
    fetchMock.mockResolvedValueOnce(Response.json({ joke: text, language: 'he' }))
    await user.click(create)
    await screen.findByText(text)
  }
  return { user, list: screen.getByRole('list', { name: 'רשימת בדיחות' }) }
}

// jsdom is not a secure context, and sharing is only offered in one
function enableShare(share: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true })
  vi.stubGlobal('isSecureContext', true)
}

function card(text: string) {
  return screen.getByText(text).closest('li')!
}

function shownJokes() {
  return within(screen.getByRole('list', { name: 'רשימת בדיחות' }))
    .queryAllByRole('listitem')
    .map((item) => item.querySelector('p')?.textContent)
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  writeText.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  fetchMock.mockReset()
  writeText.mockReset()
  // Remove a share function a test may have added
  delete (navigator as { share?: unknown }).share
})

describe('Copy', () => {
  it('copies only the chosen joke and confirms it', async () => {
    const { user } = await setupWithJokes()

    await user.click(within(card(JOKES[1])).getByRole('button', { name: 'העתקה' }))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith(JOKES[1])
    expect(within(card(JOKES[1])).getByRole('button', { name: 'הועתק!' })).toBeInTheDocument()
    expect(within(card(JOKES[0])).getByRole('button', { name: 'העתקה' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('הבדיחה הועתקה')
  })

  it('says so when copying fails', async () => {
    const { user } = await setupWithJokes([JOKES[0]])
    writeText.mockRejectedValueOnce(new Error('denied'))

    await user.click(screen.getByRole('button', { name: 'העתקה' }))

    expect(screen.getByRole('status')).toHaveTextContent('לא הצלחנו להעתיק')
    expect(screen.getByRole('button', { name: 'העתקה' })).toBeInTheDocument()
  })

  it('says so when the clipboard is not available', async () => {
    const { user } = await setupWithJokes([JOKES[0]])
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })

    await user.click(screen.getByRole('button', { name: 'העתקה' }))

    expect(screen.getByRole('status')).toHaveTextContent('לא הצלחנו להעתיק')
  })

  it('links each copy button to its joke text for screen readers', async () => {
    await setupWithJokes([JOKES[0]])
    expect(screen.getByRole('button', { name: 'העתקה' })).toHaveAccessibleDescription(JOKES[0])
  })
})

describe('Share', () => {
  it('shows no share button where sharing is not supported', async () => {
    await setupWithJokes([JOKES[0]])
    expect(screen.queryByRole('button', { name: 'שיתוף' })).not.toBeInTheDocument()
  })

  it('shares the chosen joke text where supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    enableShare(share)
    const { user } = await setupWithJokes()

    await user.click(within(card(JOKES[2])).getByRole('button', { name: 'שיתוף' }))

    expect(share).toHaveBeenCalledWith({ text: JOKES[2] })
  })

  it('treats closing the share sheet as no error', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    enableShare(share)
    const { user } = await setupWithJokes([JOKES[0]])

    await user.click(screen.getByRole('button', { name: 'שיתוף' }))

    expect(screen.getByRole('status')).not.toHaveTextContent('לא הצלחנו לשתף')
  })

  it('says so when sharing fails', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('nope', 'NotAllowedError'))
    enableShare(share)
    const { user } = await setupWithJokes([JOKES[0]])

    await user.click(screen.getByRole('button', { name: 'שיתוף' }))

    expect(screen.getByRole('status')).toHaveTextContent('לא הצלחנו לשתף')
  })
})

describe('Delete one joke', () => {
  it('asks first, starting on cancel; cancel keeps the list and returns focus', async () => {
    const { user } = await setupWithJokes()
    const trash = within(card(JOKES[1])).getByRole('button', { name: 'מחיקת בדיחה' })

    await user.click(trash)

    const dialog = screen.getByRole('dialog', { name: 'למחוק את הבדיחה?' })
    expect(dialog).toHaveAccessibleDescription('הבדיחה תוסר מהרשימה.')
    expect(within(dialog).getByRole('button', { name: 'ביטול' })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'ביטול' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(shownJokes()).toEqual(SHOWN)
    expect(trash).toHaveFocus()
  })

  it('removes only that joke after confirming, keeping the order', async () => {
    const { user } = await setupWithJokes()

    await user.click(within(card(JOKES[1])).getByRole('button', { name: 'מחיקת בדיחה' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'מחק' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(shownJokes()).toEqual([JOKES[2], JOKES[0]])
    expect(screen.getByRole('heading', { name: 'רשימת בדיחות' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('הבדיחה נמחקה')
  })

  it('treats Esc as cancel', async () => {
    const { user } = await setupWithJokes()

    await user.click(within(card(JOKES[0])).getByRole('button', { name: 'מחיקת בדיחה' }))
    // jsdom does not turn Esc into the dialog "cancel" event, so fire it as the browser would
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(shownJokes()).toEqual(SHOWN)
  })

  it('no longer sends a deleted joke as context', async () => {
    const { user } = await setupWithJokes(JOKES.slice(0, 2))

    await user.click(within(card(JOKES[0])).getByRole('button', { name: 'מחיקת בדיחה' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'מחק' }))

    fetchMock.mockResolvedValueOnce(Response.json({ joke: 'חדשה.', language: 'he' }))
    await user.click(screen.getByRole('button', { name: 'צור בדיחה' }))
    await screen.findByText('חדשה.')

    expect(sentBody(2).previousJokes).toEqual([JOKES[1]])
  })
})

describe('Clear all jokes', () => {
  it('is not offered while the list is empty', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'ניקוי בדיחות' })).not.toBeInTheDocument()
  })

  it('cancel removes nothing', async () => {
    const { user } = await setupWithJokes()
    const clear = screen.getByRole('button', { name: 'ניקוי בדיחות' })

    await user.click(clear)
    const dialog = screen.getByRole('dialog', { name: 'לנקות את כל הבדיחות?' })
    expect(dialog).toHaveAccessibleDescription('כל הבדיחות ברשימה יימחקו.')
    await user.click(within(dialog).getByRole('button', { name: 'ביטול' }))

    expect(shownJokes()).toEqual(SHOWN)
    expect(clear).toHaveFocus()
  })

  it('confirm removes every joke and leaves an empty list', async () => {
    const { user, list } = await setupWithJokes()

    await user.click(screen.getByRole('button', { name: 'ניקוי בדיחות' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'מחק' }))

    expect(list).toBeEmptyDOMElement()
    expect(screen.queryByRole('button', { name: 'ניקוי בדיחות' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'רשימת בדיחות' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('הרשימה נוקתה')
  })
})

describe('No persistent storage', () => {
  it('never writes jokes to browser storage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { user } = await setupWithJokes()

    await user.click(within(card(JOKES[0])).getByRole('button', { name: 'העתקה' }))
    await user.click(screen.getByRole('button', { name: 'ניקוי בדיחות' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'מחק' }))

    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })
})
