const {
    readJson,
    writeJson
} = require('../utils/json');

const {
    readBody,
    sendJson
} = require('../utils/http');

const RESULTS_FILE =
    './data/results.json';

const PLAYERS_FILE =
    './data/players.json';

const TOURNAMENTS_FILE =
    './data/tournaments.json';

async function handleResultsRoute(
    req,
    res
) {
    if (
        !req.url.startsWith(
            '/results'
        )
    ) {
        return false;
    }

    if (
        req.method === 'GET' &&
        req.url === '/results'
    ) {
        sendJson(
            res,
            200,
            await readJson(
                RESULTS_FILE
            )
        );

        return true;
    }

    if (
        req.method === 'POST' &&
        req.url === '/results'
    ) {
        const result =
            JSON.parse(
                await readBody(req)
            );

        const results =
            await readJson(
                RESULTS_FILE
            );

        if (
            results.some(
                r =>
                    r.tournamentId ===
                        result.tournamentId &&
                    r.year ===
                        result.year
            )
        ) {
            sendJson(res, 409, {
                error:
                    'Result already exists'
            });

            return true;
        }

        const tournaments =
            await readJson(
                TOURNAMENTS_FILE
            );

        if (
            !tournaments.some(
                t =>
                    t.id ===
                    result.tournamentId
            )
        ) {
            sendJson(res, 400, {
                error:
                    'Tournament does not exist'
            });

            return true;
        }

        const players =
            await readJson(
                PLAYERS_FILE
            );

        for (const item of result.players) {
            if (
                !players.some(
                    p =>
                        p.id ===
                        item.playerId
                )
            ) {
                sendJson(res, 400, {
                    error: `Player '${item.playerId}' does not exist`
                });

                return true;
            }
        }

        results.push(result);

        await writeJson(
            RESULTS_FILE,
            results
        );

        sendJson(res, 201, {
            success: true,
            result
        });

        return true;
    }

    if (
        req.method === 'PUT' &&
        req.url === '/results'
    ) {
        const updated =
            JSON.parse(
                await readBody(req)
            );

        const results =
            await readJson(
                RESULTS_FILE
            );

        const index =
            results.findIndex(
                r =>
                    r.tournamentId ===
                        updated.tournamentId &&
                    r.year ===
                        updated.year
            );

        if (index === -1) {
            sendJson(res, 404, {
                error:
                    'Result not found'
            });

            return true;
        }

        results[index] =
            updated;

        await writeJson(
            RESULTS_FILE,
            results
        );

        sendJson(res, 200, {
            success: true,
            result: updated
        });

        return true;
    }

    if (
        req.method === 'DELETE' &&
        req.url === '/results'
    ) {
        const request =
            JSON.parse(
                await readBody(req)
            );

        const results =
            await readJson(
                RESULTS_FILE
            );

        const exists =
            results.some(
                r =>
                    r.tournamentId ===
                        request.tournamentId &&
                    r.year ===
                        request.year
            );

        if (!exists) {
            sendJson(res, 404, {
                error:
                    'Result not found'
            });

            return true;
        }

        const filtered =
            results.filter(
                r =>
                    !(
                        r.tournamentId ===
                            request.tournamentId &&
                        r.year ===
                            request.year
                    )
            );

        await writeJson(
            RESULTS_FILE,
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
    handleResultsRoute
};