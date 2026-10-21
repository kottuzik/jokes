import type { Joke } from '../types/joke.ts'
import styles from './JokeList.module.css'

interface JokeListProps {
  jokes: Joke[]
}

export default function JokeList({ jokes }: JokeListProps) {
  return (
    <section className={styles.section} aria-labelledby="jokes-title">
      <h2 id="jokes-title" className={styles.title}>
        רשימת בדיחות
      </h2>
      <ul className={styles.list} aria-labelledby="jokes-title">
        {jokes.map((joke) => (
          <li key={joke.id} className={styles.card}>
            {/* Plain text only: model output is never rendered as HTML */}
            <p className={styles.text} dir="auto" lang={joke.language}>
              {joke.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
