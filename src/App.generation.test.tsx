import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

const LOADING = 'מכינים לך בדיחה...'
const ERROR = 'לא הצלחנו ליצור בדיחה. נסו שוב.'

const fetchMock = vi.fn<typeof fetch>()

function okResponse(joke: string, language = 'he') {
  return Response.json({ joke, language })
}

function errorResponse() {
  return Response.json({ error: 'GENERATION_FAILED' }, { status: 502 })
}

// A response the test resolves manually, to observe the loading state
function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((r) => (resolve = r))
  return { promise, resolve }
}

function sentBody(callIndex: number) {
  return JSON.parse(fetchMock.mock.calls[callIndex][1]!.body as string)
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
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('Joke generation', () => {
  it('shows a spinner, loading text and a disabled button while waiting', async () => {
    const pending = deferredResponse()
    fetchMock.mockReturnValueOnce(pending.promise)
    const { user, button, list } = setup()

    await user.click(button)
    expect(screen.getByRole('status')).toHaveTextContent(LOADING)
    expect(button).toBeDisabled()

    pending.resolve(okResponse('בדיחה ראשונה.'))
    expect(await within(list).findByText('בדיחה ראשונה.')).toBeInTheDocument()
    expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
    expect(button).toBeEnabled()
  })

  it('posts the trimmed topic to /api/jokes', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('A cat joke.', 'en'))
    const { user, input, button } = setup()

    await user.type(input, '  cats  ')
    await user.click(button)

    await screen.findByText('A cat joke.')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/jokes')
    expect(fetchMock.mock.calls[0][1]!.method).toBe('POST')
    expect(sentBody(0)).toEqual({ topic: 'cats', previousJokes: [] })
  })

  it('adds each new joke at the top, keeps the topic, and sends earlier jokes as context', async () => {
    fetchMock
      .mockResolvedValueOnce(okResponse('ראשונה.'))
      .mockResolvedValueOnce(okResponse('שנייה.'))
      .mockResolvedValueOnce(okResponse('שלישית.'))
    const { user, input, button, list } = setup()

    await user.type(input, 'חתולים')
    await user.click(button)
    await within(list).findByText('ראשונה.')
    await user.click(button)
    await within(list).findByText('שנייה.')

    const items = within(list).getAllByRole('listitem')
    // The newest joke is shown first
    expect(items.map((item) => item.querySelector('p')?.textContent)).toEqual(['שנייה.', 'ראשונה.'])
    expect(input).toHaveValue('חתולים')
    expect(sentBody(1)).toEqual({ topic: 'חתולים', previousJokes: ['ראשונה.'] })

    await user.click(button)
    await within(list).findByText('שלישית.')
    // Context is still sent oldest first
    expect(sentBody(2).previousJokes).toEqual(['ראשונה.', 'שנייה.'])
  })

  it('sends an empty topic when the field is empty', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('בדיחה כללית.'))
    const { user, button } = setup()

    await user.click(button)
    await screen.findByText('בדיחה כללית.')
    expect(sentBody(0)).toEqual({ topic: '', previousJokes: [] })
  })

  it('shows the joke text with its language and automatic direction', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('A joke.', 'en'))
    const { user, button } = setup()

    await user.click(button)
    const text = await screen.findByText('A joke.')
    expect(text).toHaveAttribute('dir', 'auto')
    expect(text).toHaveAttribute('lang', 'en')
  })

  it('renders model output as plain text, never as HTML', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('<b>bold</b><img src=x onerror=alert(1)>'))
    const { user, button, list } = setup()

    await user.click(button)
    await within(list).findByText('<b>bold</b><img src=x onerror=alert(1)>')
    expect(list.querySelector('b, img')).toBeNull()
  })

  it('starts with an empty list after a fresh load (refresh)', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('בדיחה.'))
    const first = render(<App />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'צור בדיחה' }))
    await screen.findByText('בדיחה.')
    first.unmount()

    render(<App />)
    expect(screen.getByRole('list', { name: 'רשימת בדיחות' })).toBeEmptyDOMElement()
  })
})

describe('Errors and retry', () => {
  it('shows the error message and a retry button, keeping earlier jokes', async () => {
    fetchMock.mockResolvedValueOnce(okResponse('קיימת.')).mockResolvedValueOnce(errorResponse())
    const { user, button, list } = setup()

    await user.click(button)
    await within(list).findByText('קיימת.')
    await user.click(button)

    expect(await screen.findByText(ERROR)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'נסו שוב' })).toBeInTheDocument()
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(button).toBeEnabled()
  })

  it('treats a network failure as an error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { user, button } = setup()

    await user.click(button)
    expect(await screen.findByText(ERROR)).toBeInTheDocument()
  })

  it('retries with the original request even if the topic changed', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse()).mockResolvedValueOnce(okResponse('הצליח.'))
    const { user, input, button, list } = setup()

    await user.type(input, 'כלבים')
    await user.click(button)
    await screen.findByText(ERROR)

    await user.clear(input)
    await user.type(input, 'משהו אחר')
    await user.click(screen.getByRole('button', { name: 'נסו שוב' }))

    await within(list).findByText('הצליח.')
    expect(sentBody(1)).toEqual(sentBody(0))
    expect(sentBody(1)).toEqual({ topic: 'כלבים', previousJokes: [] })
    expect(screen.queryByText(ERROR)).not.toBeInTheDocument()
    expect(input).toHaveValue('משהו אחר')
  })
})
