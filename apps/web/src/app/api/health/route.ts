export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({
    status: 'ok',
    service: 'me-me-en',
    timestamp: new Date().toISOString(),
  })
}
