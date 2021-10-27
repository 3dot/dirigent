const exec = require('util').promisify(require('child_process').exec);
const client = require('../../services/client');

module.exports = {
    compose: {
        start: async (home) => {
            console.log('Starting docker compose');
            const { stdout } = await exec(`cd ${home} && docker-compose up -d`);
            return stdout;
        },
        restart: async (home) => {
            console.log('Restarting docker compose');
            const { stdout } = await exec(`cd ${home} && docker-compose restart`);
            return stdout;
        },
        stop: async (home) => {
            console.log('Stopping docker compose');
            const { stdout } = await exec(`cd ${home} && docker-compose down`);
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