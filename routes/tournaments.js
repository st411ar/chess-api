const {
    readJson,
    writeJson
} = require('../utils/json');

const {
    readBody,
    sendJson,
    getIdFromUrl
} = require('../utils/http');

const TOURNAMENTS_FILE =
    './data/tournaments.json';

const RESULTS_FILE =
    './data/results.json';

async function handleTournamentsRoute(
    req,
    res
) {
    if (
        !req.url.startsWith(
            '/tournaments'
        )
    ) {
        return false;
    }

    if (
        req.method === 'GET' &&
        req.url === '/tournaments'
    ) {
        sendJson(
            res,
            200,
            await readJson(
                TOURNAMENTS_FILE
            )
        );

        return true;
    }

    if (
        req.method === 'POST' &&
        req.url === '/tournaments'
    ) {
        const tournament =
            JSON.parse(
                await readBody(req)
            );

        const tournaments =
            await readJson(
                TOURNAMENTS_FILE
            );

        if (!tournament.id) {
            sendJson(res, 400, {
                error:
                    'Tournament id is required'
            });

            return true;
        }

        if (!tournament.name) {
            sendJson(res, 400, {
                error:
                    'Tournament name is required'
            });

            return true;
        }

        if (
            tournaments.some(
                t =>
                    t.id ===
                    tournament.id
            )
        ) {
            sendJson(res, 409, {
                error:
                    'Tournament already exists'
            });

            return true;
        }

        tournaments.push(
            tournament
        );

        await writeJson(
            TOURNAMENTS_FILE,
            tournaments
        );

        sendJson(res, 201, {
            success: true,
            tournament
        });

        return true;
    }

    if (
        req.method === 'PUT' &&
        req.url.startsWith(
            '/tournaments/'
        )
    ) {
        const id =
            getIdFromUrl(
                req.url,
                '/tournaments/'
            );

        const update =
            JSON.parse(
                await readBody(req)
            );

        const tournaments =
            await readJson(
                TOURNAMENTS_FILE
            );

        const tournament =
            tournaments.find(
                t => t.id === id
            );

        if (!tournament) {
            sendJson(res, 404, {
                error:
                    'Tournament not found'
            });

            return true;
        }

        if (update.name) {
            tournament.name =
                update.name;
        }

        await writeJson(
            TOURNAMENTS_FILE,
            tournaments
        );

        sendJson(res, 200, {
            success: true,
            tournament
        });

        return true;
    }

    if (
        req.method === 'DELETE' &&
        req.url.startsWith(
            '/tournaments/'
        )
    ) {
        const id =
            getIdFromUrl(
                req.url,
                '/tournaments/'
            );

        const tournaments =
            await readJson(
                TOURNAMENTS_FILE
            );

        if (
            !tournaments.some(
                t => t.id === id
            )
        ) {
            sendJson(res, 404, {
                error:
                    'Tournament not found'
            });

            return true;
        }

        const results =
            await readJson(
                RESULTS_FILE
            );

        if (
            results.some(
                r =>
                    r.tournamentId ===
                    id
            )
        ) {
            sendJson(res, 409, {
                error:
                    'Tournament is used in results'
            });

            return true;
        }

        await writeJson(
            TOURNAMENTS_FILE,
            tournaments.filter(
                t => t.id !== id
            )
        );

        sendJson(res, 200, {
            success: true
        });

        return true;
    }

    return false;
}

module.exports = {
    handleTournamentsRoute
};
