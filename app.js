const WebSocket = require('ws');

const config = require('./config.json');

const open = async () => {
    const url = `${config.url}/?server=${config.server}&signature=${config.signature}`;
    console.log('Connecting', url);
    const ws = new WebSocket(url);

    require('./controllers/connection')(ws);
};

const close = () => ws.close();
process.on('SIGTERM', close);
process.on('SIGINT', close);

open();