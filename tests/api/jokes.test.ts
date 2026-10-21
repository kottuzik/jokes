// @vitest-environment node
import { APIConnectionTimeoutError, APIError } from 'openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/jokes.ts'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

// Replace only the client; keep the real error classes so the handler's instanceof checks work
vi.mock('openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openai')>()
  class FakeOpenAI {
    responses = { create: mockCreate }
  }
  return { ...actual, default: FakeOpenAI }
})

const FAKE_KEY = 'sk-test-secret-value'
const URL = 'http://localhost/api/jokes'

function post(body: unknown, headers: Record<string, string> = {}) {
  return handler.fetch(
    new Request(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

function modelReturns(joke: string, language = 'he') {
  mockCreate.mockResolvedValue({ output_text: JSON.stringify({ joke, language }) })
}

async function expectError(response: Response, status: number, code: string) {
  expect(response.status).toBe(status)
  const text = await response.text()
  expect(JSON.parse(text)).toEqual({ error: code })
  expect(text).not.toContain(FAKE_KEY)
}

beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', FAKE_KEY)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  mockCreate.mockReset()
})

describe('POST /api/jokes – request validation', () => {
  it('rejects other methods with 405', async () => {
    const response = await handler.fetch(new Request(URL, { method: 'GET' }))
    expect(response.headers.get('Allow')).toBe('POST')
    await expectError(response, 405, 'METHOD_NOT_ALLOWED')
  })

  it('rejects a non-JSON content type', async () => {
    await expectError(await post('topic', { 'Content-Type': 'text/plain' }), 400, 'INVALID_REQUEST')
  })

  it('rejects broken JSON', async () => {
    await expectError(await post('{"topic":'), 400, 'INVALID_REQUEST')
  })

  it.each([
    ['missing topic', {}],
    ['topic is not a string', { topic: 5 }],
    ['topic is too long', { topic: 'א'.repeat(201) }],
    ['previousJokes is not an array', { topic: '', previousJokes: 'x' }],
    ['previousJokes has non-strings', { topic: '', previousJokes: [1] }],
    ['too many previousJokes', { topic: '', previousJokes: Array(11).fill('x') }],
    ['a previous joke is too long', { topic: '', previousJokes: ['x'.repeat(501)] }],
    ['body is an array', []],
  ])('rejects invalid input: %s', async (_name, body) => {
    await expectError(await post(body), 400, 'INVALID_REQUEST')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects a body larger than 16KB with 413', async () => {
    await expectError(await post({ topic: '', padding: 'x'.repeat(17 * 1024) }), 413, 'PAYLOAD_TOO_LARGE')
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('POST /api/jokes – generation', () => {
  it('returns only the joke and language', async () => {
    modelReturns('  בדיחה על חתולים.  ')
    const response = await post({ topic: 'חתולים', previousJokes: [] })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ joke: 'בדיחה על חתולים.', language: 'he' })
  })

  it('sends fixed instructions to gpt-5 and keeps user content in the input only', async () => {
    modelReturns('A cat joke.', 'en')
    await post({ topic: '  cats  ', previousJokes: ['Old joke'] })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    const params = mockCreate.mock.calls[0][0]
    expect(params.model).toBe('gpt-5')
    expect(params.instructions).toContain('1 to 3 sentences')
    expect(params.instructions).toContain('write a general joke in Hebrew')
    expect(params.instructions).not.toContain('cats')
    expect(JSON.parse(params.input)).toEqual({ topic: 'cats', previous_jokes: ['Old joke'] })
  })

  it('marks an empty topic as empty, so the model writes a general Hebrew joke', async () => {
    modelReturns('בדיחה כללית.')
    await post({ topic: '   ' })
    expect(JSON.parse(mockCreate.mock.calls[0][0].input)).toEqual({ topic: '', previous_jokes: [] })
  })

  it('drops a language value that is not a language code', async () => {
    modelReturns('A joke.', 'English please')
    expect(await (await post({ topic: 'x' })).json()).toEqual({ joke: 'A joke.' })
  })
})

describe('POST /api/jokes – failures', () => {
  it('maps a provider error to 502 without leaking its message', async () => {
    mockCreate.mockRejectedValue(new APIError(401, { message: 'Incorrect API key sk-...' }, 'bad key', new Headers()))
    const response = await post({ topic: 'x' })
    await expectError(response.clone(), 502, 'GENERATION_FAILED')
    expect(await response.text()).not.toContain('Incorrect')
  })

  it('maps a timeout to 504', async () => {
    mockCreate.mockRejectedValue(new APIConnectionTimeoutError())
    await expectError(await post({ topic: 'x' }), 504, 'TIMEOUT')
  })

  it.each([
    ['not JSON', 'just text'],
    ['empty joke', JSON.stringify({ joke: '   ', language: 'he' })],
    ['too long joke', JSON.stringify({ joke: 'x'.repeat(601), language: 'he' })],
  ])('maps an invalid model output (%s) to 502', async (_name, outputText) => {
    mockCreate.mockResolvedValue({ output_text: outputText })
    await expectError(await post({ topic: 'x' }), 502, 'GENERATION_FAILED')
  })

  it('maps an unexpected error to 500', async () => {
    mockCreate.mockRejectedValue(new Error(`boom ${FAKE_KEY}`))
    await expectError(await post({ topic: 'x' }), 500, 'INTERNAL_ERROR')
  })

  it('returns 500 when the API key is missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    await expectError(await post({ topic: 'x' }), 500, 'SERVER_MISCONFIGURED')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('never logs user content', async () => {
    mockCreate.mockRejectedValue(new APIConnectionTimeoutError())
    await post({ topic: 'נושא-סודי', previousJokes: ['בדיחה-פרטית'] })
    const logged = vi.mocked(console.error).mock.calls.flat().join(' ')
    expect(logged).not.toContain('נושא-סודי')
    expect(logged).not.toContain('בדיחה-פרטית')
    expect(logged).not.toContain(FAKE_KEY)
  })
})
