// Cloudflare Worker — Notion CORS proxy for the Chief of Staff dashboard
// Deploy at: https://dash.cloudflare.com → Workers & Pages → Create Worker
// Then add a secret env var:  NOTION_TOKEN = secret_xxxxxxxx

const ALLOWED_ORIGIN = '*'; // lock to your Pages domain in prod, e.g. 'https://cos.pages.dev'

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (!env.NOTION_TOKEN) {
      return new Response('NOTION_TOKEN env var not set', { status: 500 });
    }

    const url = new URL(request.url);
    const notionPath = url.pathname + url.search;
    const notionUrl  = 'https://api.notion.com' + notionPath;

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${env.NOTION_TOKEN}`);
    headers.set('Notion-Version', '2022-06-28');
    headers.set('Content-Type', 'application/json');

    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
    }

    const res = await fetch(notionUrl, {
      method: request.method,
      headers,
      body: body ?? undefined,
    });

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    });
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Notion-Version',
  };
}
