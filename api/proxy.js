// api/proxy.js - Version avec authentification
export default async function handler(req, res) {
    // Activer CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    
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
        
        // Extraire les informations d'authentification de l'URL
        const urlObj = new URL(targetUrl);
        const username = urlObj.username;
        const password = urlObj.password;
        
        // Créer l'en-tête d'authentification si nécessaire
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
            'Connection': 'keep-alive'
        };
        
        // Ajouter l'authentification si présente dans l'URL
        if (username && password) {
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
            
            // Nettoyer l'URL des identifiants pour la requête
            urlObj.username = '';
            urlObj.password = '';
            const cleanUrl = urlObj.toString();
            
            console.log('Using authentication for:', cleanUrl);
            
            const response = await fetch(cleanUrl, { headers });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            // Lire la réponse
            const contentType = response.headers.get('content-type');
            res.setHeader('Content-Type', contentType || 'video/MP2T');
            
            // Pour les flux vidéo, renvoyer le buffer
            const buffer = await response.arrayBuffer();
            res.status(200).send(Buffer.from(buffer));
            
        } else {
            // Sans authentification, requête directe
            const response = await fetch(targetUrl, { headers });
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const buffer = await response.arrayBuffer();
            res.setHeader('Content-Type', response.headers.get('content-type') || 'video/MP2T');
            res.status(200).send(Buffer.from(buffer));
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ 
            error: 'Proxy error', 
            message: error.message,
            hint: 'Vérifiez l\'authentification du flux'
        });
    }
}
