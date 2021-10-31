const exec = require('util').promisify(require('child_process').exec);
const client = require('../../services/client');

const location = ({ name, ip }) => `location ~/${name}(.*)$ {
    proxy_set_header X-Real-IP  $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $host;

    proxy_cache STATIC;
    proxy_pass http://${ip}:8080$1;
}`;

module.exports = {
    insert: (home, { name, ip }) => {
        require('fs').writeFileSync(`${home}/conf/sites/${name}.conf`, location({ name, ip }));
    },
    remove: (home, { name }) => {
        require('fs').unlinkSync(`${home}/conf/sites/${name}.conf`);
    },
    fetch: {
        all: async () => {
            console.log('Fetch config');
            return client.post('/config', {});
        },
        nginx: async (home) => {
            // fetch config file, replace existing
            console.log('Fetch nginx config');
            /*const config = await client.post('/config', { config: ['liquidsoap'] });
            if (!config.data) return;

            await exec(`cp ${home}/radio/live.liq ${home}/radio/live.bck.liq`);
            return require('fs').writeFileSync(`${home}/radio/live.liq`, config.data);*/
        }
    }
};