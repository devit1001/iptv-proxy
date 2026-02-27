// api/proxy.js - Version avec streaming pour éviter timeout
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL manquante' });
    
    try {
        const targetUrl = decodeURIComponent(url);
        
        // Headers importants pour le streaming
        const headers = {
            'User-Agent': 'VLC/3.0.18',
            'Accept': '*/*'
        };
        
        // Ajouter Range header si présent
        if (req.headers.range) {
            headers['Range'] = req.headers.range;
            res.setHeader('Accept-Ranges', 'bytes');
        }
        
        const response = await fetch(targetUrl, { headers });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `HTTP ${response.status}` });
        }
        
        // Copier les headers de contenu
        const contentType = response.headers.get('content-type') || 'video/MP2T';
        res.setHeader('Content-Type', contentType);
        
        if (response.headers.get('content-length')) {
            res.setHeader('Content-Length', response.headers.get('content-length'));
        }
        
        if (response.headers.get('content-range')) {
            res.setHeader('Content-Range', response.headers.get('content-range'));
            res.status(206);
        }
        
        // Stream la réponse
        const reader = response.body.getReader();
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // Envoyer par chunks pour éviter timeout
                res.write(value);
                
                // Permettre à l'event loop de respirer
                await new Promise(resolve => setImmediate(resolve));
            }
            res.end();
        } finally {
            reader.releaseLock();
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
}
