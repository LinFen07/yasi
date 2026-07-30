const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 8010;
const ROOT = path.join(__dirname, 'admin');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  // Handle compression
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const shouldCompress = acceptEncoding.includes('gzip') || acceptEncoding.includes('deflate');

  let filePath = path.join(ROOT, req.url === '/' ? '/index.html' : req.url);

  // SPA fallback - serve index.html for non-file requests
  if (!path.extname(filePath)) {
    filePath = path.join(ROOT, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback
        fs.readFile(path.join(ROOT, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    let result = content;
    let encoding = 'identity';

    if (shouldCompress && MIME_TYPES[ext]) {
      // Only compress text-based files
      if (['.html', '.js', '.css', '.json', '.svg'].includes(ext)) {
        encoding = 'gzip';
        result = zlib.gzipSync(content);
      }
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Encoding': encoding,
      'Cache-Control': 'public, max-age=31536000',
      'Vary': 'Accept-Encoding'
    });
    res.end(result);
  });
});

server.listen(PORT, () => {
  console.log(`Production server running at http://localhost:${PORT}`);
});
