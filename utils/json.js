const fs = require('node:fs/promises');

async function readJson(path) {
    const content = await fs.readFile(
        path,
        'utf8'
    );

    return JSON.parse(content);
}

async function writeJson(path, data) {
    await fs.writeFile(
        path,
        JSON.stringify(data, null, 4),
        'utf8'
    );
}

module.exports = {
    readJson,
    writeJson
};