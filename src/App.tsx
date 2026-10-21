import { useState } from 'react'
import { generateJoke } from './api/jokesClient.ts'
import Header from './components/Header.tsx'
import Illustration from './components/Illustration.tsx'
import JokeForm from './components/JokeForm.tsx'
import JokeList from './components/JokeList.tsx'
import JokeStatus from './components/JokeStatus.tsx'
import type { Joke, JokeRequest } from './types/joke.ts'
import styles from './App.module.css'

// Context sent to reduce repeats (a payload bound, not a limit on how many jokes the user can create)
const MAX_PREVIOUS_JOKES = 10
const MAX_PREVIOUS_CHARS = 2000

function recentJokes(jokes: Joke[]): string[] {
  const picked: string[] = []
  let total = 0
  for (let i = jokes.length - 1; i >= 0 && picked.length < MAX_PREVIOUS_JOKES; i--) {
    const text = jokes[i].text
    if (total + text.length > MAX_PREVIOUS_CHARS) break
    picked.unshift(text)
    total += text.length
  }
  return picked
}

export default function App() {
  const [topic, setTopic] = useState('')
  const [jokes, setJokes] = useState<Joke[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [failedRequest, setFailedRequest] = useState<JokeRequest | null>(null)
  const [announcement, setAnnouncement] = useState('')

  async function send(request: JokeRequest) {
    if (isLoading) return
    setIsLoading(true)
    setFailedRequest(null)
    setAnnouncement('')
    try {
      const { joke, language } = await generateJoke(request)
      setJokes((current) => [...current, { id: crypto.randomUUID(), text: joke, language }])
      setAnnouncement('נוספה בדיחה חדשה')
    } catch {
      // Keep the exact snapshot so "נסו שוב" resends it even if the field changed meanwhile
      setFailedRequest(request)
    } finally {
      setIsLoading(false)
    }
  }

  function handleCreate() {
    void send({ topic: topic.trim(), previousJokes: recentJokes(jokes) })
  }

  function handleRetry() {
    if (failedRequest) void send(failedRequest)
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Illustration />
        <JokeForm topic={topic} onTopicChange={setTopic} onSubmit={handleCreate} isLoading={isLoading} />
        <JokeStatus
          isLoading={isLoading}
          hasError={failedRequest !== null}
          announcement={announcement}
          onRetry={handleRetry}
        />
        <JokeList jokes={jokes} />
      </main>
    </div>
  )
}
