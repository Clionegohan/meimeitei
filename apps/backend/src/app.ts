import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { isOpen } from './business-hours.js'

export const app = new Hono()

app.use('/*', cors())

app.get('/api/status', (c) => {
  return c.json({ open: isOpen() })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})
