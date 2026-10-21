import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        בדיחה בקליק
        <svg className={styles.sparks} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 14 3 6" />
          <path d="M11 12 13 3" />
          <path d="M14 16 21 11" />
        </svg>
      </h1>
    </header>
  )
}
