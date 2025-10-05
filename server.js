const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { URL } = require('url');

const PORT = process.env.PORT || 3001;
const STATIC_DIR = path.join(__dirname, 'out');

// --- WebSocket Server Setup ---
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', ws => {
  console.log('Client connected to WebSocket');
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(message) {
  console.log(`Broadcasting message to ${wss.clients.size} clients: ${message}`);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// --- HTTP Server Setup ---
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Endpoint to trigger the doorbell
  if (pathname === '/doorbell-trigger') {
    broadcast('doorbell-ring');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Doorbell event triggered');
    return;
  }

  // Basic static file server
  let filePath = path.join(STATIC_DIR, pathname);
  if (filePath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        // If file not found, serve index.html for client-side routing
        fs.readFile(path.join(STATIC_DIR, 'index.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end(`Sorry, check with the site admin for error: ${err.code} ..\n`);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Upgrade HTTP server to handle WebSockets
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log('Doorbell trigger endpoint available at /doorbell-trigger');
});
