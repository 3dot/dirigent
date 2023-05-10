const client = require('../../services/client');

const location = ({ name, ip }) => `location ~/${name}(.*)$ {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $host;

    proxy_cache STATIC;
    proxy_pass http://${ip}:8080$1;
}`;

const nginx = {
    insert: (home, { name, ip }) => {
        return require('fs').writeFileSync(`${home}/conf/sites/${name}.conf`, location({ name, ip }));
    },
    remove: (home, { name }) => {
        return require('fs').unlinkSync(`${home}/conf/sites/${name}.conf`);
    }
};

module.exports = {
    insert: nginx.insert,
    remove: nginx.remove,
    fetch: {
        config: async (home) => {
            // fetch config file
            console.log('Fetch config');
            const config = await client.post('/config', {});
            if (!config.data) return;
            return Promise.all(config.data.map(item => {
                return nginx.insert(home, item);
            }));
        }
    }
};