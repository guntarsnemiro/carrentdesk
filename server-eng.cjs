const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  res.end(fs.readFileSync('presentation-slides-eng.html'));
}).listen(7655, () => console.log('Server ready on port 7655'));
