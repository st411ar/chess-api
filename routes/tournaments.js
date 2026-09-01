const {
    readJson,
    writeJson
} = require('../utils/json');

const {
    readBody,
    sendJson,
    getIdFromUrl
} = require('../utils/http');

const TOURNAMENTS_FILE = './data/tournaments.json';
const RESULTS_FILE = './data/results.json';
const TOURNAMENT_FORMATS = ['standings', 'knockout', 'match'];

function validateFormat(format) {
    return TOURNAMENT_FORMATS.includes(format);
}

async function handleTournamentsRoute(req, res) {
    if (!req.url.startsWith('/tournaments')) {
        return false;
    }

    if (req.method === 'GET' && req.url === '/tournaments') {
        sendJson(res, 200, await readJson(TOURNAMENTS_FILE));
        return true;
    }

    if (req.method === 'POST' && req.url === '/tournaments') {
        const tournament = JSON.parse(await readBody(req));

        if (!tournament.id) {
            sendJson(res, 400, { error: 'Tournament id is required' });
            return true;
        }

        if (!tournament.name) {
            sendJson(res, 400, { error: 'Tournament name is required' });
            return true;
        }

        if (!tournament.format) {
            sendJson(res, 400, { error: 'Tournament format is required' });
            return true;
        }

        if (!validateFormat(tournament.format)) {
            sendJson(res, 400, {
                error: 'Tournament format must be standings, knockout or match'
            });
            return true;
        }

        const tournaments = await readJson(TOURNAMENTS_FILE);

        if (tournaments.some(item => item.id === tournament.id)) {
            sendJson(res, 409, { error: 'Tournament already exists' });
            return true;
        }

        tournaments.push(tournament);
        await writeJson(TOURNAMENTS_FILE, tournaments);
        sendJson(res, 201, { success: true, tournament });
        return true;
    }

    if (req.method === 'PUT' && req.url.startsWith('/tournaments/')) {
        const id = getIdFromUrl(req.url, '/tournaments/');
        const update = JSON.parse(await readBody(req));
        const tournaments = await readJson(TOURNAMENTS_FILE);
        const tournament = tournaments.find(item => item.id === id);

        if (!tournament) {
            sendJson(res, 404, { error: 'Tournament not found' });
            return true;
        }

        if (update.name !== undefined) {
            const name = String(update.name).trim();

            if (!name) {
                sendJson(res, 400, { error: 'Tournament name is required' });
                return true;
            }

            tournament.name = name;
        }

        if (update.format !== undefined) {
            if (!validateFormat(update.format)) {
                sendJson(res, 400, {
                    error: 'Tournament format must be standings, knockout or match'
                });
                return true;
            }

            tournament.format = update.format;
        }

        await writeJson(TOURNAMENTS_FILE, tournaments);
        sendJson(res, 200, { success: true, tournament });
        return true;
    }

    if (req.method === 'DELETE' && req.url.startsWith('/tournaments/')) {
        const id = getIdFromUrl(req.url, '/tournaments/');
        const tournaments = await readJson(TOURNAMENTS_FILE);

        if (!tournaments.some(item => item.id === id)) {
            sendJson(res, 404, { error: 'Tournament not found' });
            return true;
        }

        const results = await readJson(RESULTS_FILE);

        if (results.some(result => result.tournamentId === id)) {
            sendJson(res, 409, { error: 'Tournament is used in results' });
            return true;
        }

        await writeJson(
            TOURNAMENTS_FILE,
            tournaments.filter(item => item.id !== id)
        );

        sendJson(res, 200, { success: true });
        return true;
    }

    return false;
}

module.exports = {
    handleTournamentsRoute
};
