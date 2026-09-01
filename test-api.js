const mode = process.argv[2] || 'public';

const URLS = {
    local: 'http://localhost:3000',
    public: 'https://chess-api-production-4ee5.up.railway.app'
};

if (!URLS[mode]) {
    console.error(`Unknown test mode: ${mode}`);
    console.error('Use: local or public');
    process.exitCode = 1;
    return;
}

const BASE_URL = URLS[mode];

const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const playerId = `public-test-player-${runId}`;
const tournamentId = `public-test-tournament-${runId}`;
const year = 2099;

let passed = 0;
let failed = 0;
let playerCreated = false;
let tournamentCreated = false;
let resultCreated = false;

async function request(method, path, body) {
    const options = {
        method,
        headers: {
            Accept: 'application/json'
        }
    };

    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const text = await response.text();

    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        }
        catch {
            data = text;
        }
    }

    return {
        status: response.status,
        headers: response.headers,
        body: data
    };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

async function test(name, fn) {
    try {
        await fn();
        console.log(`PASS ${name}`);
        passed++;
    }
    catch (error) {
        console.error(`FAIL ${name}`);
        console.error(`     ${error.message}`);
        failed++;
    }
}

async function cleanup() {
    console.log('');
    console.log('Cleanup...');

    if (resultCreated) {
        try {
            const response = await request('DELETE', '/results', {
                tournamentId,
                year
            });

            if (response.status === 200 || response.status === 404) {
                resultCreated = false;
                console.log('CLEAN Result removed');
            }
            else {
                console.error(`CLEAN Result removal failed: HTTP ${response.status}`);
            }
        }
        catch (error) {
            console.error(`CLEAN Result removal failed: ${error.message}`);
        }
    }

    if (playerCreated) {
        try {
            const response = await request(
                'DELETE',
                `/players/${encodeURIComponent(playerId)}`
            );

            if (response.status === 200 || response.status === 404) {
                playerCreated = false;
                console.log('CLEAN Player removed');
            }
            else {
                console.error(`CLEAN Player removal failed: HTTP ${response.status}`);
            }
        }
        catch (error) {
            console.error(`CLEAN Player removal failed: ${error.message}`);
        }
    }

    if (tournamentCreated) {
        try {
            const response = await request(
                'DELETE',
                `/tournaments/${encodeURIComponent(tournamentId)}`
            );

            if (response.status === 200 || response.status === 404) {
                tournamentCreated = false;
                console.log('CLEAN Tournament removed');
            }
            else {
                console.error(`CLEAN Tournament removal failed: HTTP ${response.status}`);
            }
        }
        catch (error) {
            console.error(`CLEAN Tournament removal failed: ${error.message}`);
        }
    }
}

async function run() {
    console.log(`Testing: ${BASE_URL}`);
    console.log(`Run ID:  ${runId}`);
    console.log('');

    try {
        await test('Health endpoint', async () => {
            const response = await request('GET', '/');
            assert(response.status === 200, `Expected 200, got ${response.status}`);
            assert(response.body?.status === 'ok', 'Expected status "ok"');
        });

        await test('CORS preflight', async () => {
            const response = await fetch(`${BASE_URL}/players`, {
                method: 'OPTIONS',
                headers: {
                    Origin: 'https://st411ar.github.io',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'content-type'
                }
            });

            assert(response.status === 204, `Expected 204, got ${response.status}`);
            assert(
                response.headers.get('access-control-allow-origin') === '*',
                'Missing or unexpected Access-Control-Allow-Origin header'
            );
            assert(
                response.headers.get('access-control-allow-methods')?.includes('POST'),
                'POST is missing from Access-Control-Allow-Methods'
            );
            assert(
                response.headers.get('access-control-allow-headers')
                    ?.toLowerCase()
                    .includes('content-type'),
                'Content-Type is missing from Access-Control-Allow-Headers'
            );
        });

        await test('Get players', async () => {
            const response = await request('GET', '/players');
            assert(response.status === 200, `Expected 200, got ${response.status}`);
            assert(Array.isArray(response.body), 'Expected players array');
        });

        await test('Get tournaments', async () => {
            const response = await request('GET', '/tournaments');
            assert(response.status === 200, `Expected 200, got ${response.status}`);
            assert(Array.isArray(response.body), 'Expected tournaments array');
        });

        await test('Get results', async () => {
            const response = await request('GET', '/results');
            assert(response.status === 200, `Expected 200, got ${response.status}`);
            assert(Array.isArray(response.body), 'Expected results array');
        });

        await test('Create player', async () => {
            const response = await request('POST', '/players', {
                id: playerId,
                name: 'Публичный тестовый игрок'
            });

            assert(response.status === 201, `Expected 201, got ${response.status}`);
            playerCreated = true;
        });

        await test('Reject duplicate player', async () => {
            const response = await request('POST', '/players', {
                id: playerId,
                name: 'Дубликат игрока'
            });

            assert(response.status === 409, `Expected 409, got ${response.status}`);
        });

        await test('Update player', async () => {
            const response = await request(
                'PUT',
                `/players/${encodeURIComponent(playerId)}`,
                { name: 'Обновленный публичный игрок' }
            );

            assert(response.status === 200, `Expected 200, got ${response.status}`);
            assert(
                response.body?.player?.name === 'Обновленный публичный игрок',
                'Player name was not updated'
            );
        });

        await test('Reject tournament without format', async () => {
            const response = await request('POST', '/tournaments', {
                id: `${tournamentId}-no-format`,
                name: 'Турнир без формата'
            });

            assert(response.status === 400, `Expected 400, got ${response.status}`);
        });

        await test('Reject invalid tournament format', async () => {
            const response = await request('POST', '/tournaments', {
                id: `${tournamentId}-bad-format`,
                name: 'Турнир с ошибочным форматом',
                format: 'swiss'
            });

            assert(response.status === 400, `Expected 400, got ${response.status}`);
        });

        await test('Create tournament', async () => {
            const response = await request('POST', '/tournaments', {
                id: tournamentId,
                name: 'Публичный тестовый турнир',
                format: 'standings'
            });

            assert(response.status === 201, `Expected 201, got ${response.status}`);
            tournamentCreated = true;
        });

        await test('Reject duplicate tournament', async () => {
            const response = await request('POST', '/tournaments', {
                id: tournamentId,
                name: 'Дубликат турнира',
                format: 'standings'
            });

            assert(response.status === 409, `Expected 409, got ${response.status}`);
        });

        await test('Update tournament', async () => {
            const response = await request(
                'PUT',
                `/tournaments/${encodeURIComponent(tournamentId)}`,
                {
                    name: 'Обновленный публичный турнир',
                    format: 'knockout'
                }
            );

            assert(response.status === 200, `Expected 200, got ${response.status}`);
            assert(
                response.body?.tournament?.name === 'Обновленный публичный турнир',
                'Tournament name was not updated'
            );
            assert(
                response.body?.tournament?.format === 'knockout',
                'Tournament format was not updated'
            );
        });

        await test('Create result', async () => {
            const response = await request('POST', '/results', {
                tournamentId,
                year,
                players: [
                    {
                        playerId,
                        result: '1'
                    }
                ]
            });

            assert(response.status === 201, `Expected 201, got ${response.status}`);
            resultCreated = true;
        });

        await test('Reject duplicate result', async () => {
            const response = await request('POST', '/results', {
                tournamentId,
                year,
                players: [
                    {
                        playerId,
                        result: '1'
                    }
                ]
            });

            assert(response.status === 409, `Expected 409, got ${response.status}`);
        });

        await test('Prevent deletion of used player', async () => {
            const response = await request(
                'DELETE',
                `/players/${encodeURIComponent(playerId)}`
            );

            assert(response.status === 409, `Expected 409, got ${response.status}`);
        });

        await test('Prevent deletion of used tournament', async () => {
            const response = await request(
                'DELETE',
                `/tournaments/${encodeURIComponent(tournamentId)}`
            );

            assert(response.status === 409, `Expected 409, got ${response.status}`);
        });

        await test('Update result', async () => {
            const response = await request('PUT', '/results', {
                tournamentId,
                year,
                players: [
                    {
                        playerId,
                        result: '2'
                    }
                ]
            });

            assert(response.status === 200, `Expected 200, got ${response.status}`);
            assert(
                response.body?.result?.players?.[0]?.result === '2',
                'Result value was not updated'
            );
        });

        await test('Delete result', async () => {
            const response = await request('DELETE', '/results', {
                tournamentId,
                year
            });

            assert(response.status === 200, `Expected 200, got ${response.status}`);
            resultCreated = false;
        });

        await test('Delete player', async () => {
            const response = await request(
                'DELETE',
                `/players/${encodeURIComponent(playerId)}`
            );

            assert(response.status === 200, `Expected 200, got ${response.status}`);
            playerCreated = false;
        });

        await test('Delete tournament', async () => {
            const response = await request(
                'DELETE',
                `/tournaments/${encodeURIComponent(tournamentId)}`
            );

            assert(response.status === 200, `Expected 200, got ${response.status}`);
            tournamentCreated = false;
        });
    }
    finally {
        await cleanup();
    }

    console.log('');
    console.log('====================');
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('====================');

    if (failed > 0) {
        process.exitCode = 1;
    }
}

run().catch(error => {
    console.error('Unexpected test runner error:');
    console.error(error);
    process.exitCode = 1;
});
