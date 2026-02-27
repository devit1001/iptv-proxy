// api/proxy.js - Version ultra simple
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL manquante' });
    }
    
    try {
        const targetUrl = decodeURIComponent(url);
        console.log('Proxying:', targetUrl);
        
        // Requête avec les headers de base
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                'Accept': '*/*'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Déterminer le type MIME
        let contentType = response.headers.get('content-type');
        if (!contentType) {
            if (targetUrl.includes('.ts')) contentType = 'video/MP2T';
            else if (targetUrl.includes('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
            else contentType = 'video/mpeg';
        }
        
        res.setHeader('Content-Type', contentType);
        
        // Renvoyer le flux
        const buffer = await response.arrayBuffer();
        res.status(200).send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}
