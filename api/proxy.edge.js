// api/proxy.edge.js - Edge Function for streaming
export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Optional: specify region
};

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const decodedUrl = decodeURIComponent(targetUrl);
    console.log('Proxying:', decodedUrl);

    // Fetch the stream
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'video/mp2t';

    // For M3U8 files, modify URLs
    if (decodedUrl.includes('.m3u8')) {
      const text = await response.text();
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/') + 1);
      const host = req.headers.get('host');
      
      // Rewrite TS URLs to use this same proxy
      const modified = text.replace(/([^\n]+\.ts)/g, (match) => {
        if (match.startsWith('http')) return match;
        const proxyUrl = `https://${host}/api/proxy.edge?url=${encodeURIComponent(baseUrl + match)}`;
        return proxyUrl;
      });

      return new Response(modified, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For TS files, stream directly
    return new Response(response.body, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Error: ' + error.message, { status: 500 });
  }
}
