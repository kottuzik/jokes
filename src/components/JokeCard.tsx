import { useEffect, useRef, useState } from 'react'
import type { Joke } from '../types/joke.ts'
import { canShare, copyText, shareText } from '../utils/share.ts'
import { CopyIcon, ShareIcon, TrashIcon } from './icons.tsx'
import styles from './JokeCard.module.css'

const COPIED_FEEDBACK_MS = 2000

interface JokeCardProps {
  joke: Joke
  onAnnounce: (message: string) => void
  onDelete: (id: string, trigger: HTMLElement) => void
}

export default function JokeCard({ joke, onAnnounce, onDelete }: JokeCardProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const textId = `joke-${joke.id}`

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function handleCopy() {
    if (await copyText(joke.text)) {
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
      onAnnounce('הבדיחה הועתקה')
    } else {
      onAnnounce('לא הצלחנו להעתיק')
    }
  }

  async function handleShare() {
    if ((await shareText(joke.text)) === 'failed') onAnnounce('לא הצלחנו לשתף')
  }

  return (
    <li className={styles.card}>
      {/* Plain text only: model output is never rendered as HTML */}
      <p id={textId} className={styles.text} dir="auto" lang={joke.language}>
        {joke.text}
      </p>
      <div className={styles.actions}>
        <button className={styles.action} type="button" aria-describedby={textId} onClick={handleCopy}>
          <CopyIcon className={styles.icon} />
          {copied ? 'הועתק!' : 'העתקה'}
        </button>
        {/* Shown only where the device can share; otherwise no broken button */}
        {canShare() && (
          <button className={styles.action} type="button" aria-describedby={textId} onClick={handleShare}>
            <ShareIcon className={styles.icon} />
            שיתוף
          </button>
        )}
        <button
          className={`${styles.action} ${styles.delete}`}
          type="button"
          aria-label="מחיקת בדיחה"
          aria-describedby={textId}
          onClick={(event) => onDelete(joke.id, event.currentTarget)}
        >
          <TrashIcon className={styles.icon} />
        </button>
      </div>
    </li>
  )
}
