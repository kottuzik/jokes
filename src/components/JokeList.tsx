import styles from './JokeList.module.css'

export default function JokeList() {
  return (
    <section className={styles.section} aria-labelledby="jokes-title">
      <h2 id="jokes-title" className={styles.title}>
        רשימת בדיחות
      </h2>
      {/* Jokes are added here in Milestone 2 */}
      <ul className={styles.list} aria-labelledby="jokes-title" />
    </section>
  )
}
