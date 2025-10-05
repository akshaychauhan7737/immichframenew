
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { URL } = require('url');

const PORT = process.env.PORT || 3001;
const STATIC_DIR = path.join(__dirname, 'out');
const IMMICH_URL = process.env.IMMICH_API_URL;
const IMMICH_KEY = process.env.IMMICH_API_KEY;
const OPENWEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const LATITUDE = process.env.LATITUDE;
const LONGITUDE = process.env.LONGITUDE;

if (!IMMICH_URL || !IMMICH_KEY || !OPENWEATHER_KEY || !LATITUDE || !LONGITUDE) {
  console.error('FATAL: One or more required environment variables are missing.');
  console.error('Please check your docker-compose.yml file and ensure all variables are set.');
  process.exit(1);
}

// --- API Proxy Setup ---
const immichProxy = createProxyMiddleware({
  target: IMMICH_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/immich': '/api' },
  headers: {
    'x-api-key': IMMICH_KEY,
  },
  logLevel: 'info',
});

// Helper function to make API calls to OpenWeatherMap
const fetchOpenWeather = (apiPath, req, res) => {
    const url = `https://api.openweathermap.org/data/2.5/${apiPath}?lat=${LATITUDE}&lon=${LONGITUDE}&units=metric&appid=${OPENWEATHER_KEY}`;
    
    const apiRequest = https.get(url, (apiRes) => {
        // Pass through status code and headers from OpenWeatherMap
        res.writeHead(apiRes.statusCode, {
            ...apiRes.headers,
            // Ensure correct content-type for JSON responses
            'Content-Type': 'application/json' 
        });
        // Pipe the response body directly to the client
        apiRes.pipe(res, { end: true });
    });

    apiRequest.on('error', (e) => {
        console.error(`Error fetching from OpenWeatherMap: ${e.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Failed to fetch weather data' }));
    });
};


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
  
  // Proxy API requests
  if (pathname.startsWith('/api/immich')) {
    return immichProxy(req, res);
  }
  if (pathname.startsWith('/api/weather')) {
    // Path is just 'weather'
    return fetchOpenWeather('weather', req, res);
  }
  if (pathname.startsWith('/api/air_pollution')) {
    // Path is just 'air_pollution'
    return fetchOpenWeather('air_pollution', req, res);
  }
  
  // Health check endpoint
  if (pathname === '/api/server/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ res: 'pong' }));
    return;
  }

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
        // If file not found, serve the 404 page
        fs.readFile(path.join(STATIC_DIR, '404.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end(`Sorry, check with the site admin for error: ${err.code} ..\n`);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
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
    // This will handle all WebSocket connections, regardless of the path
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log('Doorbell trigger endpoint available at /doorbell-trigger');
});
