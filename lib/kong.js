const request = require('request');
const util    = require('util');
const kongOld = util.promisify(request.defaults({
    qs: {
        apikey: process.env.KONG_OLD_APIKEY
    },
    json: true,
    baseUrl: process.env.KONG_OLD_URL,
}));
const kongNew = util.promisify(request.defaults({
    qs: {
        apikey: process.env.KONG_NEW_APIKEY
    },
    json: true,
    baseUrl: process.env.KONG_NEW_URL,
}));

if (!process.env.KONG_NEW_URL) {
    throw new Error('Requires KONG_NEW_URL');
}
if (!process.env.KONG_OLD_URL) {
    throw new Error('Requires KONG_OLD_URL');
}
if (!process.env.KONG_NEW_APIKEY) {
    throw new Error('Requires KONG_NEW_APIKEY');
}
if (!process.env.KONG_OLD_APIKEY) {
    throw new Error('Requires KONG_OLD_APIKEY');
}

module.exports = {
    old: kongOld,
    new: kongNew
};
