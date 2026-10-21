import type { FormEvent } from 'react'
import styles from './JokeForm.module.css'

interface JokeFormProps {
  topic: string
  onTopicChange: (topic: string) => void
  onSubmit: () => void
  // True while a request is running or when offline
  disabled: boolean
}

export default function JokeForm({ topic, onTopicChange, onSubmit, disabled }: JokeFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Enter in the field also submits, so guard against double requests here too
    if (!disabled) onSubmit()
  }

  return (
    <section className={styles.card} aria-labelledby="topic-title">
      <h2 id="topic-title" className={styles.title}>
        <label htmlFor="topic">בחר נושא לבדיחה</label>
      </h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          id="topic"
          className={styles.input}
          type="text"
          dir="auto"
          autoComplete="off"
          placeholder="לדוגמה: חיות, עבודה, בית ספר..."
          value={topic}
          onChange={(event) => onTopicChange(event.target.value)}
        />
        <button className={styles.button} type="submit" disabled={disabled}>
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9z" />
            <path d="M18 3l.8 2.2L21 6l-2.2.8L18 9l-.8-2.2L15 6l2.2-.8z" />
          </svg>
          צור בדיחה
        </button>
      </form>
    </section>
  )
}
