// api/proxy.js - Proxy IPTV pour contourner CORS
export default async function handler(req, res) {
    // Activer CORS pour toutes les requêtes
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    
    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // Récupérer l'URL du flux depuis les paramètres
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    try {
        console.log('Proxying request for:', url);
        
        // Décoder l'URL
        const targetUrl = decodeURIComponent(url);
        
        // Extraire les en-têtes Range si présents (pour la lecture partielle)
        const rangeHeader = req.headers.range;
        
        // Options de la requête
        const fetchOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
                'Connection': 'keep-alive',
                'Range': rangeHeader || ''
            }
        };
        
        // Faire la requête au serveur IPTV
        const response = await fetch(targetUrl, fetchOptions);
        
        // Vérifier si la réponse est OK
        if (!response.ok && response.status !== 206) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        // Copier les en-têtes importants
        const headersToCopy = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
            'content-disposition'
        ];
        
        headersToCopy.forEach(header => {
            const value = response.headers.get(header);
            if (value) {
                res.setHeader(header, value);
            }
        });
        
        // Pour les flux TS, s'assurer que le type est correct
        if (targetUrl.includes('.ts')) {
            res.setHeader('Content-Type', 'video/MP2T');
        }
        
        // Stream la réponse directement au client
        const buffer = await response.arrayBuffer();
        res.status(response.status).send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Proxy error', 
            message: error.message 
        });
    }
}
