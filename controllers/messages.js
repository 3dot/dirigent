const { send } = require('../services/ws').socket;
const state = require('../services/state');

const [
    update,
    status,
    config
] = [
    require('./update'),
    require('./status'),
    require('./config')
];

module.exports = {
    status: async () => {
        const status = state.get('status:prometheus');
        send('status', { service: "prometheus", status });
    },
    update: async () => {
        // update dirigent, restart
        await update();
        await send('update:ack', { task: +new Date(), done: true });
        process.kill(process.pid, 'SIGTERM');
    },
    config: async (data) => {
        // download configuration file, restart container
        console.log('Download configuration file, restart container');
        await config.fetch.liquidsoap();
        await config.container.restart('liquidsoap');
        send('config:ack', { task: +new Date(), done: true });
    }
};