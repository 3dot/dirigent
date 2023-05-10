const exec = require('util').promisify(require('child_process').exec);
const client = require('../../services/client');

module.exports = {
    fetch: {
        all: async () => {
            console.log('Fetch config');
            return client.post('/config', {});
        },
        nginx: async (home) => {
            // fetch config file, replace existing
            console.log('Fetch nginx config');
            const config = await client.post('/config', { config: ['nginx'] });
            if (!config.data) return;

            await exec(`cp ${home}/nginx.conf ${home}/nginx.bck.conf`);
            return require('fs').writeFileSync(`${home}/nginx.conf`, config.data);
        }
    }
};