// api/proxy.js - Version avec gestion complète des Range headers
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    
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
        
        // Récupérer le header Range du navigateur
        const rangeHeader = req.headers.range;
        console.log('Range header:', rangeHeader);
        
        // Préparer les headers pour la requête au serveur IPTV
        const fetchHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Connection': 'keep-alive'
        };
        
        // Si le navigateur demande un Range, le transmettre
        if (rangeHeader) {
            fetchHeaders['Range'] = rangeHeader;
        }
        
        // Timeout plus long
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000);
        
        const response = await fetch(targetUrl, {
            headers: fetchHeaders,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok && response.status !== 206) {
            return res.status(response.status).json({ 
                error: `HTTP ${response.status}`,
                url: targetUrl.substring(0, 100)
            });
        }
        
        // Copier tous les headers importants
        const headersToCopy = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges'
        ];
        
        headersToCopy.forEach(header => {
            const value = response.headers.get(header);
            if (value) {
                res.setHeader(header, value);
            }
        });
        
        // Forcer le Content-Type si absent
        if (!res.getHeader('content-type')) {
            res.setHeader('Content-Type', 'video/MP2T');
        }
        
        // Pour les réponses partielles (206)
        if (response.status === 206) {
            res.status(206);
        }
        
        // Lire et renvoyer la réponse
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Proxy error:', error);
        
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'Timeout - Le serveur IPTV met trop de temps à répondre' });
        }
        
        res.status(500).json({ error: error.message });
    }
}
