// api/proxy.js - Version avec authentification corrigée
export default async function handler(req, res) {
    // CORS headers
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
        
        // Extraire l'authentification de l'URL
        const urlObj = new URL(targetUrl);
        const username = urlObj.username;
        const password = urlObj.password;
        
        // Nettoyer l'URL des identifiants pour la requête
        urlObj.username = '';
        urlObj.password = '';
        const cleanUrl = urlObj.toString();
        
        // Créer les headers
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Referer': 'http://yn83wvfx.k2sfsc.xyz',
            'Origin': 'http://yn83wvfx.k2sfsc.xyz'
        };
        
        // Ajouter l'authentification Basic Auth
        if (username && password) {
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
            console.log('Auth ajoutée pour:', username);
        }
        
        console.log('Headers:', headers);
        
        // Faire la requête
        const response = await fetch(cleanUrl, { headers });
        
        if (!response.ok) {
            console.log('Status:', response.status);
            return res.status(response.status).json({ 
                error: `Serveur a répondu: ${response.status}`,
                details: 'Vérifiez que username/password sont corrects'
            });
        }
        
        // Pour M3U (texte)
        if (targetUrl.includes('get.php') || targetUrl.includes('.m3u')) {
            const text = await response.text();
            res.setHeader('Content-Type', 'text/plain');
            return res.status(200).send(text);
        }
        
        // Pour TS (vidéo)
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'video/MP2T');
        res.status(200).send(Buffer.from(buffer));
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}
