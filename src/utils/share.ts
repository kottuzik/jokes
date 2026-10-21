// Feature detection and error mapping for the browser Clipboard and Web Share APIs

export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && window.isSecureContext
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export type ShareResult = 'shared' | 'cancelled' | 'failed'

export async function shareText(text: string): Promise<ShareResult> {
  try {
    await navigator.share({ text })
    return 'shared'
  } catch (error) {
    // Closing the share sheet is a user choice, not an error
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}
