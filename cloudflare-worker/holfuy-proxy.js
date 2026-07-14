// Cloudflare Worker: CORS proxy for the Holfuy weather APIs (live + archive).
//
// Holfuy's API works fine server-to-server (no CORS header), but browsers
// block cross-origin fetches without one. This worker simply forwards the
// request to Holfuy and adds the missing CORS header to the response.
//
// Deploy:
//   1. https://dash.cloudflare.com → Workers & Pages → Create → "Deploy a Worker"
//   2. Paste this file's content into the editor, click "Deploy"
//   3. Copy the worker URL (e.g. https://holfuy-proxy.<you>.workers.dev)
//   4. Paste that URL into Wind Alert → Einstellungen → Holfuy → Proxy-URL
//
// Routing:
//   <worker-url>/          → https://api.holfuy.com/live/
//   <worker-url>/archive   → https://api.holfuy.com/archive/
//
// Shared stations (optional):
//   Lets other people connect to a private station without knowing its
//   password — the worker fills it in server-side.
//   1. Worker dashboard → Settings → Variables and Secrets → Add
//   2. Name: STATION_PASSWORDS, type: Secret, value (JSON): {"1399":"the-real-password"}
//   3. Deploy. Other users can now just enter station ID 1399 in Wind Alert,
//      leaving the password field empty — the worker injects it for them.

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const isArchive = url.pathname.replace(/\/$/, '').endsWith('/archive')
    const target    = new URL(isArchive ? 'https://api.holfuy.com/archive/' : 'https://api.holfuy.com/live/')
    target.search   = url.search

    // Fill in a shared password server-side if the client didn't send one.
    if (!target.searchParams.get('pw') && env.STATION_PASSWORDS) {
      try {
        const stationId = target.searchParams.get('s')
        const passwords  = JSON.parse(env.STATION_PASSWORDS)
        if (stationId && passwords[stationId]) {
          target.searchParams.set('pw', passwords[stationId])
        }
      } catch (_e) {
        // malformed STATION_PASSWORDS secret — ignore, request proceeds without pw
      }
    }

    const upstream = await fetch(target.toString())
    const body     = await upstream.text()

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
    })
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
