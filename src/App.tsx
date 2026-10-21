import { useEffect, useRef, useState } from 'react'
import { generateJoke } from './api/jokesClient.ts'
import ConfirmDialog from './components/ConfirmDialog.tsx'
import Header from './components/Header.tsx'
import Illustration from './components/Illustration.tsx'
import JokeForm from './components/JokeForm.tsx'
import JokeList from './components/JokeList.tsx'
import JokeStatus from './components/JokeStatus.tsx'
import { useOnlineStatus } from './hooks/useOnlineStatus.ts'
import type { Announcement, Joke, JokeRequest } from './types/joke.ts'
import styles from './App.module.css'

// Context sent to reduce repeats (a payload bound, not a limit on how many jokes the user can create)
const MAX_PREVIOUS_JOKES = 10
const MAX_PREVIOUS_CHARS = 2000

// The list is newest first; the result is oldest first, as sent before
function recentJokes(jokes: Joke[]): string[] {
  const picked: string[] = []
  let total = 0
  for (let i = 0; i < jokes.length && picked.length < MAX_PREVIOUS_JOKES; i++) {
    const text = jokes[i].text
    if (total + text.length > MAX_PREVIOUS_CHARS) break
    picked.unshift(text)
    total += text.length
  }
  return picked
}

type PendingDelete = { kind: 'one'; id: string } | { kind: 'all' } | null

export default function App() {
  const [topic, setTopic] = useState('')
  const [jokes, setJokes] = useState<Joke[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [failedRequest, setFailedRequest] = useState<JokeRequest | null>(null)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const deleteTrigger = useRef<HTMLElement | null>(null)
  const focusAfterClose = useRef<'trigger' | 'heading' | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isOnline = useOnlineStatus()

  // Runs after the dialog has closed (child effects run first), so focus is not taken back
  useEffect(() => {
    if (pendingDelete !== null || focusAfterClose.current === null) return
    const target = focusAfterClose.current === 'heading' ? headingRef.current : deleteTrigger.current
    focusAfterClose.current = null
    deleteTrigger.current = null
    target?.focus()
  }, [pendingDelete])

  // A new id re-mounts the message, so repeating the same text is announced again
  function announce(text: string) {
    setAnnouncement((current) => ({ text, id: (current?.id ?? 0) + 1 }))
  }

  async function send(request: JokeRequest) {
    // No AI request is sent without a network
    if (isLoading || !isOnline) return
    setIsLoading(true)
    setFailedRequest(null)
    setAnnouncement(null)
    try {
      const { joke, language } = await generateJoke(request)
      setJokes((current) => [{ id: crypto.randomUUID(), text: joke, language }, ...current])
      announce('נוספה בדיחה חדשה')
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

  function requestDelete(id: string, trigger: HTMLElement) {
    deleteTrigger.current = trigger
    setPendingDelete({ kind: 'one', id })
  }

  function requestClearAll(trigger: HTMLElement) {
    deleteTrigger.current = trigger
    setPendingDelete({ kind: 'all' })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    if (pendingDelete.kind === 'one') {
      const { id } = pendingDelete
      setJokes((current) => current.filter((joke) => joke.id !== id))
      announce('הבדיחה נמחקה')
    } else {
      setJokes([])
      announce('הרשימה נוקתה')
    }
    // The trigger button is gone after a deletion
    focusAfterClose.current = 'heading'
    setPendingDelete(null)
  }

  function cancelDelete() {
    focusAfterClose.current = 'trigger'
    setPendingDelete(null)
  }

  const isClearAll = pendingDelete?.kind === 'all'

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Illustration />
        <JokeForm topic={topic} onTopicChange={setTopic} onSubmit={handleCreate} disabled={isLoading || !isOnline} />
        <JokeStatus
          isLoading={isLoading}
          isOffline={!isOnline}
          hasError={failedRequest !== null}
          announcement={announcement}
          onRetry={handleRetry}
        />
        <JokeList
          jokes={jokes}
          headingRef={headingRef}
          onAnnounce={announce}
          onDelete={requestDelete}
          onClearAll={requestClearAll}
        />
      </main>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={isClearAll ? 'לנקות את כל הבדיחות?' : 'למחוק את הבדיחה?'}
        description={isClearAll ? 'כל הבדיחות ברשימה יימחקו.' : 'הבדיחה תוסר מהרשימה.'}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}
