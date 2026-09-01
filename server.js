const http = require('node:http');
const fs = require('node:fs/promises');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    try {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        if (req.method === 'GET' && req.url === '/') {
            res.end(JSON.stringify({
                name: 'Chess API',
                status: 'ok'
            }));
            return;
        }

        if (req.method === 'GET' && req.url === '/players') {
            const content = await fs.readFile(
                './data/players.json',
                'utf8'
            );

            res.end(content);
            return;
        }

        if (req.method === 'GET' && req.url === '/tournaments') {
            const content = await fs.readFile(
                './data/tournaments.json',
                'utf8'
            );

            res.end(content);
            return;
        }

        if (req.method === 'GET' && req.url === '/results') {
            const content = await fs.readFile(
                './data/results.json',
                'utf8'
            );

            res.end(content);
            return;
        }

        res.statusCode = 404;

        res.end(JSON.stringify({
            error: 'Not found'
        }));
    } catch (error) {
        console.error(error);

        res.statusCode = 500;

        res.end(JSON.stringify({
            error: 'Internal server error'
        }));
    }
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});