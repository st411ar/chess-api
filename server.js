const http = require('node:http');

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    res.end(JSON.stringify({
        ok: true
    }));
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});