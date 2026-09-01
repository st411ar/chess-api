async function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            resolve(body);
        });

        req.on('error', reject);
    });
}

function sendJson(
    res,
    statusCode,
    data
) {
    res.statusCode = statusCode;

    res.setHeader(
        'Content-Type',
        'application/json; charset=utf-8'
    );

    res.end(JSON.stringify(data));
}

function getIdFromUrl(
    url,
    prefix
) {
    return decodeURIComponent(
        url.substring(prefix.length)
    );
}

module.exports = {
    readBody,
    sendJson,
    getIdFromUrl
};