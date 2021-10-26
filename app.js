const config = require('./config.json');
const state = require('./services/state');
const { close } = require('./services/ws').init({
    ws: config.ws,
    server: config.server,
    signature: config.signature
});

const shutdown = () => {
    state.intervals.forEach(item => clearInterval(item));
    state.timeouts.forEach(item => clearTimeout(item));
    close();
};

// start
require('./controllers/startup')(config.service);

// on end
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);