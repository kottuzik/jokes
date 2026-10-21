import { expect, test } from '@playwright/test'
import { createButton, jokeItems, topicField } from './helpers.ts'

// Calls the real /api/jokes and gpt-5, which costs money: runs only with E2E_REAL=1
test.skip(!process.env.E2E_REAL, 'Set E2E_REAL=1 to call the real AI')
test.use({ serviceWorkers: 'block' })
test.describe.configure({ mode: 'serial' })

for (const topic of ['חתולים', '']) {
  test(`creates a real joke (topic: "${topic || 'empty'}")`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'One run per topic is enough')
    test.setTimeout(60_000)
    await page.goto('/')
    await topicField(page).fill(topic)

    const responsePromise = page.waitForResponse((r) => r.url().endsWith('/api/jokes'))
    await createButton(page).click()
    const response = await responsePromise

    expect(response.status()).toBe(200)
    const body = (await response.json()) as Record<string, unknown>
    expect(Object.keys(body).sort()).toEqual(['joke', 'language'])
    expect(typeof body.joke).toBe('string')
    expect((body.joke as string).length).toBeGreaterThan(0)
    expect((body.joke as string).length).toBeLessThanOrEqual(600)

    await expect(jokeItems(page)).toHaveCount(1)
    await expect(jokeItems(page).first()).toContainText((body.joke as string).slice(0, 20))
    console.log(`[${topic || 'empty'}] ${body.language}: ${body.joke}`)
  })
}
