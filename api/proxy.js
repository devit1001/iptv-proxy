// api/proxy.js - VERSION SIMPLIFIÉE (FONCTIONNELLE)
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Gérer OPTIONS
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
        
        // REQUÊTE DIRECTE - Pas de manipulation d'URL
        // Les identifiants sont déjà dans l'URL (username:password@)
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
                'Accept': '*/*'
            }
        });
        
        console.log('Status:', response.status);
        
        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Erreur ${response.status}`,
                url: targetUrl.substring(0, 50) + '...' // Log partiel pour debug
            });
        }
        
        // Déterminer le type de contenu
        const contentType = response.headers.get('content-type') || 'video/MP2T';
        res.setHeader('Content-Type', contentType);
        
        // Renvoyer la réponse
        const buffer = await response.arrayBuffer();
        res.status(200).send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}
