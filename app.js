const WebSocket = require('ws');

const config = require('./config.json');
const cleanup = [];

const open = async () => {
    const url = `${config.ws}/?server=${config.server}&signature=${config.signature}`;
    console.log('Connecting', url);
    const ws = new WebSocket(url);

    require('./controllers/connection')(ws, cleanup);

    const close = () => {
        cleanup.forEach(item => clearInterval(item));
        ws.close();
        process.exit(1);
    };
    process.on('SIGTERM', close);
    process.on('SIGINT', close);
};

open();