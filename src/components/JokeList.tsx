import type { Ref } from 'react'
import type { Joke } from '../types/joke.ts'
import JokeCard from './JokeCard.tsx'
import { TrashIcon } from './icons.tsx'
import styles from './JokeList.module.css'

interface JokeListProps {
  jokes: Joke[]
  headingRef: Ref<HTMLHeadingElement>
  onAnnounce: (message: string) => void
  onDelete: (id: string, trigger: HTMLElement) => void
  onClearAll: (trigger: HTMLElement) => void
}

export default function JokeList({ jokes, headingRef, onAnnounce, onDelete, onClearAll }: JokeListProps) {
  return (
    <section className={styles.section} aria-labelledby="jokes-title">
      <div className={styles.header}>
        {/* Focusable by script only: focus lands here after a deletion removes the trigger */}
        <h2 id="jokes-title" className={styles.title} ref={headingRef} tabIndex={-1}>
          רשימת בדיחות
        </h2>
        {jokes.length > 0 && (
          <button className={styles.clear} type="button" onClick={(event) => onClearAll(event.currentTarget)}>
            <TrashIcon className={styles.icon} />
            ניקוי בדיחות
          </button>
        )}
      </div>
      <ul className={styles.list} aria-labelledby="jokes-title">
        {jokes.map((joke) => (
          <JokeCard key={joke.id} joke={joke} onAnnounce={onAnnounce} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  )
}
