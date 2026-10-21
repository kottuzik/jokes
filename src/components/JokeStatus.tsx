import styles from './JokeStatus.module.css'

interface JokeStatusProps {
  isLoading: boolean
  hasError: boolean
  announcement: string
  onRetry: () => void
}

// Always rendered so screen readers announce changes inside the live region
export default function JokeStatus({ isLoading, hasError, announcement, onRetry }: JokeStatusProps) {
  return (
    <div className={styles.status} role="status" aria-live="polite">
      {isLoading && (
        <p className={styles.loading}>
          <span className={styles.spinner} aria-hidden="true" />
          מכינים לך בדיחה...
        </p>
      )}

      {!isLoading && hasError && (
        <div className={styles.error}>
          <p className={styles.errorText}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 7v6M12 16.5v.5" />
            </svg>
            לא הצלחנו ליצור בדיחה. נסו שוב.
          </p>
          <button className={styles.retry} type="button" onClick={onRetry}>
            נסו שוב
          </button>
        </div>
      )}

      {!isLoading && !hasError && announcement && <span className={styles.visuallyHidden}>{announcement}</span>}
    </div>
  )
}
