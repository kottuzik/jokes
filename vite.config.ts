import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

interface FetchHandler {
  fetch(request: Request): Promise<Response>
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

// Dev only: serve /api/jokes from api/jokes.ts, the same handler Vercel runs in production.
// The key is loaded into the dev server's process.env only; without a VITE_ prefix it never reaches the client.
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY

      server.middlewares.use('/api/jokes', async (req, res) => {
        try {
          const { default: handler } = (await server.ssrLoadModule('/api/jokes.ts')) as { default: FetchHandler }
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
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApi()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
