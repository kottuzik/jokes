import styles from './Illustration.module.css'

// Decorative only: a laughing smiley over soft color blobs, hidden from assistive tech.
export default function Illustration() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <span className={`${styles.blob} ${styles.blobPurple}`} />
      <span className={`${styles.blob} ${styles.blobLilac}`} />
      <span className={`${styles.blob} ${styles.blobYellow}`} />
      <svg className={styles.face} viewBox="0 0 120 120" focusable="false">
        <circle cx="60" cy="60" r="54" fill="#FACC15" />
        <circle cx="30" cy="68" r="9" fill="#FB923C" opacity="0.45" />
        <circle cx="90" cy="68" r="9" fill="#FB923C" opacity="0.45" />
        <path d="M32 50q9-12 18 0M70 50q9-12 18 0" fill="none" stroke="#2E1065" strokeWidth="6" strokeLinecap="round" />
        <path d="M30 64h60q-3 34-30 34T30 64z" fill="#2E1065" />
        <path d="M43 85q17-10 34 0q-7 10-17 10t-17-10z" fill="#F87171" />
      </svg>
      <svg className={styles.sparks} viewBox="0 0 40 40" focusable="false">
        <path d="M8 22 4 12M18 16 20 4M26 24 36 18" />
      </svg>
    </div>
  )
}
