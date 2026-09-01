const http = require('node:http');

const {
    sendJson
} = require('./utils/http');

const {
    handlePlayersRoute
} = require('./routes/players');

const {
    handleTournamentsRoute
} = require('./routes/tournaments');

const {
    handleResultsRoute
} = require('./routes/results');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    try {
        if (await handlePlayersRoute(req, res)) {
            return;
        }

        if (await handleTournamentsRoute(req, res)) {
            return;
        }

        if (await handleResultsRoute(req, res)) {
            return;
        }

        if (req.method === 'GET' && req.url === '/') {
            sendJson(res, 200, {
                name: 'Chess API',
                status: 'ok'
            });

            return;
        }

        sendJson(res, 404, {
            error: 'Not found'
        });
    }
    catch (error) {
        console.error(error);

        sendJson(res, 500, {
            error: 'Internal server error'
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});