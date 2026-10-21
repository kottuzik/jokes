import { useEffect, useRef } from 'react'
import { TrashIcon } from './icons.tsx'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}

// Native modal <dialog>: the browser keeps focus inside, blocks the page and maps Esc to "cancel"
export default function ConfirmDialog({ open, title, description, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Start on the safe choice
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      onCancel={(event) => {
        // Let React state close the dialog so it stays the single source of truth
        event.preventDefault()
        onCancel()
      }}
    >
      {open && (
        <>
          <h2 id="confirm-title" className={styles.title}>
            {title}
          </h2>
          <p id="confirm-description" className={styles.description}>
            {description}
          </p>
          <div className={styles.buttons}>
            <button className={styles.confirm} type="button" onClick={onConfirm}>
              <TrashIcon className={styles.icon} />
              מחק
            </button>
            <button ref={cancelRef} className={styles.cancel} type="button" onClick={onCancel}>
              ביטול
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}
