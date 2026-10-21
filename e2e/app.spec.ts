import { expect, test } from '@playwright/test'
import { axeViolations, createButton, createJoke, jokeItems, mockJokes, topicField } from './helpers.ts'

// Page-level routing is unreliable through a service worker, so it is blocked here (PWA tests are in pwa.spec.ts)
test.use({ serviceWorkers: 'block' })

test.describe('Generation (FR-01, FR-02)', () => {
  test('creates jokes for Hebrew, English and empty topics, newest first', async ({ page }) => {
    const requests = await mockJokes(page, [
      { joke: 'בדיחה על חתולים.', language: 'he' },
      { joke: 'A joke about cats.', language: 'en' },
      { joke: 'בדיחה כללית.', language: 'he' },
    ])
    await page.goto('/')

    await createJoke(page, 'חתולים', 'בדיחה על חתולים.')
    await expect(topicField(page)).toHaveValue('חתולים')

    await createJoke(page, 'cats', 'A joke about cats.')
    await createJoke(page, '', 'בדיחה כללית.')

    await expect(jokeItems(page)).toHaveCount(3)
    await expect(jokeItems(page).nth(0)).toContainText('בדיחה כללית.')
    await expect(jokeItems(page).nth(2)).toContainText('בדיחה על חתולים.')

    expect(requests[0]).toEqual({ topic: 'חתולים', previousJokes: [] })
    expect(requests[1]).toEqual({ topic: 'cats', previousJokes: ['בדיחה על חתולים.'] })
    expect(requests[2]).toEqual({ topic: '', previousJokes: ['בדיחה על חתולים.', 'A joke about cats.'] })
  })

  test('a reload clears the list', async ({ page }) => {
    await mockJokes(page, [{ joke: 'בדיחה זמנית.' }])
    await page.goto('/')
    await createJoke(page, '', 'בדיחה זמנית.')
    await page.reload()
    await expect(jokeItems(page)).toHaveCount(0)
  })

  test('model output is shown as text, never as HTML', async ({ page }) => {
    await mockJokes(page, [{ joke: '<b>מודגש</b><img src=x onerror="window.__xss=1">' }])
    await page.goto('/')
    await createJoke(page, '', '<b>מודגש</b>')
    await expect(jokeItems(page).first().locator('b, img')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  })
})

test.describe('Loading and errors (FR-03)', () => {
  test('shows a spinner and disables the button while waiting', async ({ page }) => {
    await mockJokes(page, [{ delayMs: 1500, joke: 'בדיחה איטית.' }])
    await page.goto('/')
    await createButton(page).click()
    await expect(page.getByText('מכינים לך בדיחה...')).toBeVisible()
    await expect(createButton(page)).toBeDisabled()
    await expect(jokeItems(page).first()).toContainText('בדיחה איטית.')
    await expect(createButton(page)).toBeEnabled()
  })

  test('retry resends the same request and keeps earlier jokes', async ({ page }) => {
    const requests = await mockJokes(page, [{ joke: 'בדיחה ראשונה.' }, { status: 500 }, { joke: 'בדיחה שנייה.' }])
    await page.goto('/')
    await createJoke(page, 'ים', 'בדיחה ראשונה.')

    await topicField(page).fill('הרים')
    await createButton(page).click()
    await expect(page.getByText('לא הצלחנו ליצור בדיחה. נסו שוב.')).toBeVisible()
    await expect(jokeItems(page)).toHaveCount(1)

    await topicField(page).fill('משהו אחר')
    await page.getByRole('button', { name: 'נסו שוב' }).click()
    await expect(jokeItems(page).first()).toContainText('בדיחה שנייה.')
    await expect(jokeItems(page)).toHaveCount(2)
    expect(requests[2]).toEqual(requests[1])
    expect(requests[2].topic).toBe('הרים')
  })
})

test.describe('Copy and share (FR-04)', () => {
  test('copy puts only the chosen joke on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await mockJokes(page, [{ joke: 'בדיחה אחת.' }, { joke: 'בדיחה שתיים.' }])
    await page.goto('/')
    await createJoke(page, '', 'בדיחה אחת.')
    await createJoke(page, '', 'בדיחה שתיים.')

    await jokeItems(page).nth(1).getByRole('button', { name: 'העתקה' }).click()
    await expect(jokeItems(page).nth(1).getByRole('button', { name: 'הועתק!' })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('בדיחה אחת.')
  })

  test('share hands the joke text to the device share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      const calls: ShareData[] = []
      ;(window as unknown as { __shares: ShareData[] }).__shares = calls
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          calls.push(data)
        },
      })
    })
    await mockJokes(page, [{ joke: 'בדיחה לשיתוף.' }])
    await page.goto('/')
    await createJoke(page, '', 'בדיחה לשיתוף.')
    await jokeItems(page).first().getByRole('button', { name: 'שיתוף' }).click()
    expect(await page.evaluate(() => (window as unknown as { __shares: ShareData[] }).__shares)).toEqual([
      { text: 'בדיחה לשיתוף.' },
    ])
  })

  test('without device sharing there is no share button', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    })
    await mockJokes(page, [{ joke: 'בדיחה בלי שיתוף.' }])
    await page.goto('/')
    await createJoke(page, '', 'בדיחה בלי שיתוף.')
    await expect(jokeItems(page).first().getByRole('button', { name: 'שיתוף' })).toHaveCount(0)
    await expect(jokeItems(page).first().getByRole('button', { name: 'העתקה' })).toBeVisible()
  })
})

test.describe('Delete and clear (FR-05)', () => {
  test.beforeEach(async ({ page }) => {
    await mockJokes(page, [{ joke: 'בדיחה א.' }, { joke: 'בדיחה ב.' }, { joke: 'בדיחה ג.' }])
    await page.goto('/')
    for (const text of ['בדיחה א.', 'בדיחה ב.', 'בדיחה ג.']) await createJoke(page, '', text)
  })

  test('deleting one joke asks first and removes only that joke', async ({ page }) => {
    const deleteMiddle = jokeItems(page).nth(1).getByRole('button', { name: 'מחיקת בדיחה' })
    const dialog = page.getByRole('dialog', { name: 'למחוק את הבדיחה?' })

    await deleteMiddle.click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'ביטול' }).click()
    await expect(dialog).toBeHidden()
    await expect(jokeItems(page)).toHaveCount(3)
    await expect(deleteMiddle).toBeFocused()

    await deleteMiddle.click()
    await dialog.getByRole('button', { name: 'מחק' }).click()
    await expect(jokeItems(page).locator('p')).toHaveText(['בדיחה ג.', 'בדיחה א.'])
  })

  test('clearing all asks first and empties the list', async ({ page }) => {
    const clear = page.getByRole('button', { name: 'ניקוי בדיחות' })
    const dialog = page.getByRole('dialog', { name: 'לנקות את כל הבדיחות?' })

    await clear.click()
    await dialog.getByRole('button', { name: 'ביטול' }).click()
    await expect(jokeItems(page)).toHaveCount(3)

    await clear.click()
    await dialog.getByRole('button', { name: 'מחק' }).click()
    await expect(jokeItems(page)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'רשימת בדיחות' })).toBeFocused()
  })

  test('the dialog works with the keyboard alone', async ({ page }) => {
    const clear = page.getByRole('button', { name: 'ניקוי בדיחות' })
    const dialog = page.getByRole('dialog', { name: 'לנקות את כל הבדיחות?' })

    await clear.focus()
    await page.keyboard.press('Enter')
    await expect(dialog.getByRole('button', { name: 'ביטול' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.getByRole('button', { name: 'מחק' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(clear).toBeFocused()
    await expect(jokeItems(page)).toHaveCount(3)
  })
})

test.describe('Accessibility and layout (§5)', () => {
  test('no WCAG 2.2 AA violations in each screen state', async ({ page, context }) => {
    await mockJokes(page, [{ joke: 'בדיחה לבדיקה.' }, { delayMs: 2000, joke: 'בדיחה איטית.' }, { status: 500 }])
    await page.goto('/')
    expect(await axeViolations(page), 'initial').toEqual([])

    await createJoke(page, '', 'בדיחה לבדיקה.')
    expect(await axeViolations(page), 'with jokes').toEqual([])

    await createButton(page).click()
    await expect(page.getByText('מכינים לך בדיחה...')).toBeVisible()
    expect(await axeViolations(page), 'loading').toEqual([])
    await expect(jokeItems(page)).toHaveCount(2)

    await createButton(page).click()
    await expect(page.getByText('לא הצלחנו ליצור בדיחה. נסו שוב.')).toBeVisible()
    expect(await axeViolations(page), 'error').toEqual([])

    await context.setOffline(true)
    await expect(page.getByText('אין חיבור לאינטרנט. כדי ליצור בדיחה יש להתחבר לרשת.')).toBeVisible()
    expect(await axeViolations(page), 'offline').toEqual([])
    await context.setOffline(false)

    await page.getByRole('button', { name: 'ניקוי בדיחות' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await axeViolations(page), 'dialog').toEqual([])
  })

  for (const width of [320, 375, 1280]) {
    test(`no horizontal scroll at ${width}px, RTL, and no navigation`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await mockJokes(page, [{ joke: 'בדיחה ארוכה במיוחד שבודקת שהכרטיס נשבר לשורות ולא יוצא מגבולות המסך בכלל.' }])
      await page.goto('/')
      await createJoke(page, '', 'בדיחה ארוכה')
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await expect(page.getByRole('navigation')).toHaveCount(0)
      await expect(page.getByRole('link')).toHaveCount(0)
    })
  }
})
