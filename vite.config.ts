import type { IncomingMessage } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import react from '@vitejs/plugin-react'
import { loadEnv, type Connect, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

interface FetchHandler {
  fetch(request: Request): Promise<Response>
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

// Serves /api/jokes from api/jokes.ts, the same handler Vercel runs in production.
// Used by `npm run dev` and by `npm run preview` (the built app, where the service worker is active).
// The key is loaded into the server's process.env only; without a VITE_ prefix it never reaches the client.
function localApi(): Plugin {
  function loadKey(mode: string) {
    const env = loadEnv(mode, process.cwd(), '')
    if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY
  }

  function middleware(loadHandler: () => Promise<FetchHandler>): Connect.NextHandleFunction {
    return async (req, res) => {
      try {
        const handler = await loadHandler()
        const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
        const request = new Request(new URL(req.originalUrl ?? '/api/jokes', 'http://localhost'), {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: hasBody ? new Uint8Array(await readBody(req)) : undefined,
        })
        const response = await handler.fetch(request)
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
      } catch {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'INTERNAL_ERROR' }))
      }
    }
  }

  return {
    name: 'local-api',
    configureServer(server) {
      loadKey(server.config.mode)
      server.middlewares.use(
        '/api/jokes',
        middleware(async () => ((await server.ssrLoadModule('/api/jokes.ts')) as { default: FetchHandler }).default),
      )
    },
    configurePreviewServer(server) {
      loadKey(server.config.mode)
      // The preview server has no module loader; Node runs the TypeScript handler directly (type stripping)
      const handlerUrl = pathToFileURL(resolve('api/jokes.ts')).href
      server.middlewares.use(
        '/api/jokes',
        middleware(async () => ((await import(handlerUrl)) as { default: FetchHandler }).default),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    localApi(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Icons are generated at build time from public/favicon.svg, with their <head> links
      pwaAssets: {
        preset: 'minimal-2023',
        image: 'public/favicon.svg',
        injectThemeColor: false,
      },
      manifest: {
        name: 'בדיחה בקליק',
        short_name: 'בדיחה בקליק',
        description: 'בדיחה בקליק – כל נושא, בדיחה חדשה!',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#7C3AED',
        background_color: '#F9FAFB',
      },
      workbox: {
        // Precache the app shell only; no runtimeCaching, so no network response (and never /api) is cached
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    // e2e/ holds Playwright tests, run separately with `npm run test:e2e`
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
})
