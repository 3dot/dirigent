const exec = require('util').promisify(require('child_process').exec);
const axios = require('axios').default;

const setup = require('../config.json');
const status = require('./status');

const client = axios.create({
    baseURL: setup.url,
    headers: { 'x-server-id': setup.server, 'x-server-signature': setup.signature }
});

const config = {
    startup: async ({ list }) => {
        // prepare config
        console.log('Received active containers list', list);
        if (!Array.isArray(list) || list.length === 0) {
            console.log('No running containers, have to setup');
            // fetch liquidsoap
            await config.fetch.liquidsoap();
            await config.compose.start();
        } else {
            console.log('Found running containers, monitoring...');
        }
        return status.monitor();
    },
    compose: {
        start: async () => {
            console.log('Starting docker compose');
            const { stdout, stderr } = await exec(`cd /home/srt2hls && docker-compose up -d`);
            return stdout;
        },
        restart: async () => {
            console.log('Restarting docker compose');
            const { stdout, stderr } = await exec(`cd /home/srt2hls && docker-compose restart`);
            return stdout;
        },
        stop: async () => {
            console.log('Stopping docker compose');
            const { stdout, stderr } = await exec(`cd /home/srt2hls && docker-compose down`);
            return stdout;
        }
    },
    container: {
        restart: async (container) => {
            console.log(`Restarting container`, container);
            const { stdout, stderr } = await exec(`docker restart ${container}`);
            return stdout;
        }
    },
    fetch: {
        all: async () => {
            return client.post('/config', {});
        },
        liquidsoap: async () => {
            // fetch config file, replace existing
            const config = await client.post('/config', {config: ['liquidsoap']});
            if (!config.data) return;
            
            await exec(`cp /home/srt2hls/radio/live.liq /home/srt2hls/radio/live.bck.liq`);
            return require('fs').writeFileSync("/home/srt2hls/radio/live.liq", config.data);
        }
    }
};

module.exports = config;