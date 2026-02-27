// api/proxy.js - Version DEBUG
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL manquante' });
    }
    
    try {
        const targetUrl = decodeURIComponent(url);
        console.log('URL complète:', targetUrl);
        
        // Extraire les composants pour vérification
        const urlObj = new URL(targetUrl);
        console.log('Host:', urlObj.hostname);
        console.log('Username:', urlObj.username);
        console.log('Password présent:', !!urlObj.password);
        
        // Créer une nouvelle URL sans les identifiants pour voir
        const urlWithoutAuth = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}${urlObj.search}`;
        console.log('URL sans auth:', urlWithoutAuth);
        
        // Essayer avec fetch simple
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('Status:', response.status);
        console.log('Status text:', response.statusText);
        
        // Voir les headers de réponse
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        console.log('Response headers:', headers);
        
        if (!response.ok) {
            return res.status(response.status).json({
                error: `Erreur ${response.status}`,
                statusText: response.statusText,
                url: targetUrl.substring(0, 100),
                headers: headers
            });
        }
        
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', response.headers.get('content-type') || 'video/MP2T');
        res.status(200).send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
}
