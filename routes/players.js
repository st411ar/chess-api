const {
    readJson,
    writeJson
} = require('../utils/json');

const {
    readBody,
    sendJson,
    getIdFromUrl
} = require('../utils/http');

const PLAYERS_FILE =
    './data/players.json';

const RESULTS_FILE =
    './data/results.json';

async function handlePlayersRoute(
    req,
    res
) {
    if (
        !req.url.startsWith('/players')
    ) {
        return false;
    }

    if (
        req.method === 'GET' &&
        req.url === '/players'
    ) {
        const players =
            await readJson(
                PLAYERS_FILE
            );

        sendJson(
            res,
            200,
            players
        );

        return true;
    }

    if (
        req.method === 'POST' &&
        req.url === '/players'
    ) {
        const body =
            await readBody(req);

        const player =
            JSON.parse(body);

        if (!player.id) {
            sendJson(res, 400, {
                error:
                    'Player id is required'
            });

            return true;
        }

        if (!player.name) {
            sendJson(res, 400, {
                error:
                    'Player name is required'
            });

            return true;
        }

        const players =
            await readJson(
                PLAYERS_FILE
            );

        if (
            players.some(
                p =>
                    p.id === player.id
            )
        ) {
            sendJson(res, 409, {
                error:
                    'Player already exists'
            });

            return true;
        }

        players.push(player);

        await writeJson(
            PLAYERS_FILE,
            players
        );

        sendJson(res, 201, {
            success: true,
            player
        });

        return true;
    }

    if (
        req.method === 'PUT' &&
        req.url.startsWith(
            '/players/'
        )
    ) {
        const id =
            getIdFromUrl(
                req.url,
                '/players/'
            );

        const body =
            await readBody(req);

        const update =
            JSON.parse(body);

        const players =
            await readJson(
                PLAYERS_FILE
            );

        const player =
            players.find(
                p => p.id === id
            );

        if (!player) {
            sendJson(res, 404, {
                error:
                    'Player not found'
            });

            return true;
        }

        if (update.name) {
            player.name =
                update.name;
        }

        await writeJson(
            PLAYERS_FILE,
            players
        );

        sendJson(res, 200, {
            success: true,
            player
        });

        return true;
    }

    if (
        req.method === 'DELETE' &&
        req.url.startsWith(
            '/players/'
        )
    ) {
        const id =
            getIdFromUrl(
                req.url,
                '/players/'
            );

        const players =
            await readJson(
                PLAYERS_FILE
            );

        if (
            !players.some(
                p => p.id === id
            )
        ) {
            sendJson(res, 404, {
                error:
                    'Player not found'
            });

            return true;
        }

        const results =
            await readJson(
                RESULTS_FILE
            );

        const isUsed =
            results.some(
                result =>
                    result.players.some(
                        player =>
                            player.playerId ===
                            id
                    )
            );

        if (isUsed) {
            sendJson(res, 409, {
                error:
                    'Player is used in results'
            });

            return true;
        }

        const filtered =
            players.filter(
                p => p.id !== id
            );

        await writeJson(
            PLAYERS_FILE,
            filtered
        );

        sendJson(res, 200, {
            success: true
        });

        return true;
    }

    return false;
}

module.exports = {
    handlePlayersRoute
};