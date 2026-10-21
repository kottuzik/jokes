import { expect, test, type Page } from '@playwright/test'
import { createButton } from './helpers.ts'

const OFFLINE_MESSAGE = 'אין חיבור לאינטרנט. כדי ליצור בדיחה יש להתחבר לרשת.'

test.use({ serviceWorkers: 'allow' })

async function waitForServiceWorker(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, { timeout: 20_000 })
}

test('manifest and service worker make the app installable, without an install button', async ({ page }) => {
  await waitForServiceWorker(page)

  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href
    return href ? ((await (await fetch(href)).json()) as Record<string, unknown>) : null
  })
  expect(manifest).toMatchObject({ name: 'בדיחה בקליק', lang: 'he', dir: 'rtl', display: 'standalone', start_url: '/' })

  // Chrome's own installability check
  const cdp = await page.context().newCDPSession(page)
  const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: { errorId: string }[]
  }
  expect(installabilityErrors.map((e) => e.errorId)).toEqual([])

  await expect(page.getByRole('button', { name: /התקנ|התקן/ })).toHaveCount(0)
})

test('opens offline after one online visit, with no AI request and no cached API responses', async ({ page, context }) => {
  const apiRequests: string[] = []
  context.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url())
  })

  await waitForServiceWorker(page)
  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { name: 'בדיחה בקליק' })).toBeVisible()
  await expect(page.getByText(OFFLINE_MESSAGE)).toBeVisible()
  await expect(createButton(page)).toBeDisabled()
  await page.getByRole('textbox', { name: 'בחר נושא לבדיחה' }).fill('נושא')
  await page.keyboard.press('Enter')
  expect(apiRequests).toEqual([])

  await context.setOffline(false)
  await expect(page.getByText(OFFLINE_MESSAGE)).toBeHidden()
  await expect(createButton(page)).toBeEnabled()

  const cachedApiUrls = await page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) urls.push(request.url)
    }
    return urls.filter((url) => new URL(url).pathname.startsWith('/api/'))
  })
  expect(cachedApiUrls).toEqual([])
})
