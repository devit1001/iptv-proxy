// api/proxy.js - Version finale avec gestion des erreurs
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL manquante' });
    }
    
    try {
        const targetUrl = decodeURIComponent(url);
        console.log('Proxying:', targetUrl);
        
        // Timeout plus long pour Vercel (max 30s pour plan gratuit)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000); // 28 secondes
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `HTTP ${response.status}`,
                url: targetUrl.substring(0, 100)
            });
        }
        
        // Copier tous les headers importants
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        
        // Forcer le bon Content-Type pour les flux TS
        const contentType = response.headers.get('content-type') || 'video/MP2T';
        res.setHeader('Content-Type', contentType);
        
        // Ajouter des headers CORS supplémentaires
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
        
        // Lire et renvoyer la réponse
        const buffer = await response.arrayBuffer();
        res.status(200).send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Proxy error:', error);
        
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'Timeout - Le serveur IPTV met trop de temps à répondre' });
        }
        
        res.status(500).json({ error: error.message });
    }
}
