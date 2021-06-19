const WebSocket = require('ws');
const args = process.argv.slice(2);

const url = `${process.env['WS_URL'] || args[0]}/?server=${process.env['WS_SERVER'] || args[1]}&signature=${process.env['WS_SIGNATURE'] || args[2]}`;
console.log('Connecting', url);
const ws = new WebSocket(url);

require('./controllers/connection')(ws);

const close = () => ws.close();
process.on('SIGTERM', close);
process.on('SIGINT', close);