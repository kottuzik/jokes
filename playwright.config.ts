import { defineConfig, devices } from '@playwright/test'

// Runs against a deployed URL when BASE_URL is set; otherwise against the local production build
const baseURL = process.env.BASE_URL ?? 'http://localhost:4175'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    locale: 'he-IL',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // The built app, where the service worker is active (ADR-9)
        command: 'npm run build && npm run preview -- --port 4175 --strictPort',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
})
