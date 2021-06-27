const { send } = require('../services/ws').socket;

const [
    status,
    config
] = [
    require('./status'),
    require('./config')
];

module.exports = {
    config: async (data) => {
        // download configuration file, restart container
        console.log('Download configuration file, restart container');
        await config.fetch.liquidsoap();
        await config.container.restart('liquidsoap');
        send('config:ack', { task: +new Date(), done: true });
    }
};