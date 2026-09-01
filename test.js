const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function request(method, path, body) {
    const response = await fetch(
        `${BASE_URL}${path}`,
        {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
                ? JSON.stringify(body)
                : undefined
        }
    );

    let json = null;

    try {
        json = await response.json();
    }
    catch {
    }

    return {
        status: response.status,
        body: json
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
        console.error(error.message);

        failed++;
    }
}

(async () => {

    await test(
        'Create player',
        async () => {
            const response = await request(
                'POST',
                '/players',
                {
                    id: 'test-player',
                    name: 'Тестовый игрок'
                }
            );

            assert(
                response.status === 201,
                `Expected 201, got ${response.status}`
            );
        }
    );

    await test(
        'Duplicate player',
        async () => {
            const response = await request(
                'POST',
                '/players',
                {
                    id: 'test-player',
                    name: 'Тестовый игрок'
                }
            );

            assert(
                response.status === 409,
                `Expected 409, got ${response.status}`
            );
        }
    );

    await test(
        'Update player',
        async () => {
            const response = await request(
                'PUT',
                '/players/test-player',
                {
                    name: 'Обновленный игрок'
                }
            );

            assert(
                response.status === 200,
                `Expected 200, got ${response.status}`
            );
        }
    );

    await test(
        'Create tournament',
        async () => {
            const response = await request(
                'POST',
                '/tournaments',
                {
                    id: 'test-tournament',
                    name: 'Тестовый турнир'
                }
            );

            assert(
                response.status === 201,
                `Expected 201, got ${response.status}`
            );
        }
    );

    await test(
        'Duplicate tournament',
        async () => {
            const response = await request(
                'POST',
                '/tournaments',
                {
                    id: 'test-tournament',
                    name: 'Тестовый турнир'
                }
            );

            assert(
                response.status === 409,
                `Expected 409, got ${response.status}`
            );
        }
    );

    await test(
        'Update tournament',
        async () => {
            const response = await request(
                'PUT',
                '/tournaments/test-tournament',
                {
                    name: 'Обновленный турнир'
                }
            );

            assert(
                response.status === 200,
                `Expected 200, got ${response.status}`
            );
        }
    );

    await test(
        'Create result',
        async () => {
            const response = await request(
                'POST',
                '/results',
                {
                    tournamentId: 'test-tournament',
                    year: 2030,
                    players: [
                        {
                            playerId: 'test-player',
                            result: '1'
                        }
                    ]
                }
            );

            assert(
                response.status === 201,
                `Expected 201, got ${response.status}`
            );
        }
    );

    await test(
        'Duplicate result',
        async () => {
            const response = await request(
                'POST',
                '/results',
                {
                    tournamentId: 'test-tournament',
                    year: 2030,
                    players: [
                        {
                            playerId: 'test-player',
                            result: '1'
                        }
                    ]
                }
            );

            assert(
                response.status === 409,
                `Expected 409, got ${response.status}`
            );
        }
    );

    await test(
        'Prevent player delete while used',
        async () => {
            const response = await request(
                'DELETE',
                '/players/test-player'
            );

            assert(
                response.status === 409,
                `Expected 409, got ${response.status}`
            );
        }
    );

    await test(
        'Prevent tournament delete while used',
        async () => {
            const response = await request(
                'DELETE',
                '/tournaments/test-tournament'
            );

            assert(
                response.status === 409,
                `Expected 409, got ${response.status}`
            );
        }
    );

    await test(
        'Update result',
        async () => {
            const response = await request(
                'PUT',
                '/results',
                {
                    tournamentId: 'test-tournament',
                    year: 2030,
                    players: [
                        {
                            playerId: 'test-player',
                            result: '2'
                        }
                    ]
                }
            );

            assert(
                response.status === 200,
                `Expected 200, got ${response.status}`
            );
        }
    );

    await test(
        'Delete result',
        async () => {
            const response = await request(
                'DELETE',
                '/results',
                {
                    tournamentId: 'test-tournament',
                    year: 2030
                }
            );

            assert(
                response.status === 200,
                `Expected 200, got ${response.status}`
            );
        }
    );

    await test(
        'Delete player',
        async () => {
            const response = await request(
                'DELETE',
                '/players/test-player'
            );

            assert(
                response.status === 200,
                `Expected 200, got ${response.status}`
            );
        }
    );

    await test(
        'Delete tournament',
        async () => {
            const response = await request(
                'DELETE',
                '/tournaments/test-tournament'
            );

            assert(
                response.status === 200,
                `Expected 200, got ${response.status}`
            );
        }
    );

    console.log('');
    console.log('====================');
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('====================');

    process.exit(
        failed > 0 ? 1 : 0
    );

})();