const axios = require('axios').default;
const config = require('../config.json');

module.exports = axios.create({
    baseURL: config.url,
    headers: { 'x-server-id': config.server, 'x-server-signature': config.signature }
});