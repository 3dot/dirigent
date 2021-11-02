const exec = require('util').promisify(require('child_process').exec);
const client = require('../../services/client');

module.exports = {
    fetch: {
        all: async () => {
            console.log('Fetch config');
            return client.post('/config', {});
        },
        liquidsoap: async (home) => {
            // fetch config file, replace existing
            console.log('Fetch liquidsoap config');
            const config = await client.post('/config', { config: ['liquidsoap'] });
            if (!config.data) return;

            await exec(`cp ${home}/radio/live.liq ${home}/radio/live.bck.liq`);
            return require('fs').writeFileSync(`${home}/radio/live.liq`, config.data);
        }
    }
};