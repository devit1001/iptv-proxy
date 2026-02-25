export default async function handler(req, res) {
  // Enable CORS for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, User-Agent");

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    console.log("Fetching:", decodedUrl);
    
    // Fetch the stream with proper headers
    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*",
        "Referer": "http://protzpwcf1.top:8080/"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    // Get the content type from the original response
    const contentType = response.headers.get("content-type");
    
    // Set correct content type
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    } else if (decodedUrl.includes(".m3u8")) {
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    } else if (decodedUrl.includes(".ts")) {
      res.setHeader("Content-Type", "video/mp2t");
    } else {
      res.setHeader("Content-Type", "video/mp2t");
    }

    // For M3U8/HLS playlists, we need to modify URLs
    if (decodedUrl.includes(".m3u8")) {
      let text = await response.text();
      
      // Get base URL for relative paths
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf("/") + 1);
      
      // FIX: Use absolute URLs with the current host
      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      
      // Replace relative URLs with absolute proxy URLs
      text = text.replace(/([^\n]+\.ts)/g, (match) => {
        if (match.startsWith("http")) return match;
        // Create absolute URL
        const absoluteUrl = `${protocol}://${host}/api/proxy?url=${encodeURIComponent(baseUrl + match)}`;
        return absoluteUrl;
      });
      
      return res.status(200).send(text);
    }
    
    // For TS segments, stream the binary data
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    
    return res.status(200).send(buffer);

  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).send("Error fetching stream: " + error.message);
  }
}
