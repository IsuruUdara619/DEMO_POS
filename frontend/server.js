import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Determine backend URL
// Priority: BACKEND_URL > VITE_API_URL > Default
let backendUrl = process.env.BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:5000';

// Ensure protocol
if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    backendUrl = `https://${backendUrl}`;
}

// Strip trailing slash
backendUrl = backendUrl.replace(/\/$/, '');

console.log('--- FRONTEND SERVER STARTING ---');
console.log(`PORT: ${port}`);
console.log(`BACKEND_URL: ${backendUrl}`);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Proxy API requests
// Use context matching instead of path mounting to preserve '/api' prefix
app.use(createProxyMiddleware('/api', {
    target: backendUrl,
    changeOrigin: true,
    secure: false, // Don't verify SSL certs (useful for self-signed or internal)
    onProxyReq: (proxyReq, req, res) => {
        // Optional logging
        // console.log(`Proxying ${req.method} ${req.path} -> ${backendUrl}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
    }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - return index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Frontend server listening on port ${port}`);
});
