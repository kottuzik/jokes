import { createRequire } from 'node:module'
import { expect, type Page, type Route } from '@playwright/test'

const require = createRequire(import.meta.url)
const axePath = require.resolve('axe-core/axe.min.js')

export interface JokeRequestBody {
  topic: string
  previousJokes: string[]
}

type MockReply = { joke: string; language?: string } | { status: number } | { delayMs: number; joke: string }

// Replaces /api/jokes with scripted replies (one per request, the last one repeats) and records each request body
export async function mockJokes(page: Page, replies: MockReply[]) {
  const requests: JokeRequestBody[] = []
  await page.route('**/api/jokes', async (route: Route) => {
    requests.push(route.request().postDataJSON() as JokeRequestBody)
    const reply = replies[Math.min(requests.length - 1, replies.length - 1)]
    if ('status' in reply) {
      await route.fulfill({ status: reply.status, json: { error: 'GENERATION_FAILED' } })
      return
    }
    if ('delayMs' in reply) await new Promise((resolve) => setTimeout(resolve, reply.delayMs))
    await route.fulfill({ json: { joke: reply.joke, language: 'language' in reply ? reply.language : 'he' } })
  })
  return requests
}

export function topicField(page: Page) {
  return page.getByRole('textbox', { name: 'בחר נושא לבדיחה' })
}

export function createButton(page: Page) {
  return page.getByRole('button', { name: 'צור בדיחה' })
}

export function jokeItems(page: Page) {
  return page.getByRole('list', { name: 'רשימת בדיחות' }).getByRole('listitem')
}

export async function createJoke(page: Page, topic: string, expectedText: string) {
  await topicField(page).fill(topic)
  await createButton(page).click()
  await expect(jokeItems(page).first()).toContainText(expectedText)
}

// WCAG 2.2 AA rules, including color contrast (not available in jsdom)
export async function axeViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ path: axePath })
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: { id: string; nodes: { target: string[] }[] }[] }> } }).axe
    const results = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    })
    return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
  })
}
