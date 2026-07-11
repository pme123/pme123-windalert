// Cloudflare Worker: CORS proxy for the Holfuy live weather API.
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

export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const target = new URL('https://api.holfuy.com/live/')
    target.search = url.search

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
