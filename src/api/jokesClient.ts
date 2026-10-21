import type { JokeRequest } from '../types/joke.ts'

export interface GeneratedJoke {
  joke: string
  language?: string
}

// Throws on any network error, non-200 status or malformed response; the UI shows one approved message for all
export async function generateJoke(request: JokeRequest, signal?: AbortSignal): Promise<GeneratedJoke> {
  const response = await fetch('/api/jokes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })
  if (!response.ok) throw new Error(`Joke request failed with status ${response.status}`)

  const data: unknown = await response.json()
  const { joke, language } = (data ?? {}) as Record<string, unknown>
  if (typeof joke !== 'string' || joke.trim() === '') throw new Error('Malformed joke response')

  return typeof language === 'string' ? { joke, language } : { joke }
}
