const http = require('http');
const fs = require('fs');
const server = http.createServer((req, res) => {
  fs.readFile('C:/Users/User/Documents/GitHub/Carrentdesk/presentation-slides.html', (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(data);
  });
});
server.listen(7654, () => { process.stdout.write('READY\n'); });
