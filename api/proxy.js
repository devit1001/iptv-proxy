// api/proxy.js - VERSION CORRIGÉE
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL manquante' });
    }
    
    try {
        // Décoder l'URL mais préserver les &
        let targetUrl = decodeURIComponent(url);
        
        console.log('URL reçue:', targetUrl);
        
        // Requête directe
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Erreur ${response.status}`,
                url: targetUrl
            });
        }
        
        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'video/MP2T';
        res.setHeader('Content-Type', contentType);
        res.status(200).send(Buffer.from(buffer));
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
