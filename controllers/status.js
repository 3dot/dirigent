const exec = require('util').promisify(require('child_process').exec);
const axios = require('axios').default;

const state = require('../services/state');

const status = {
    monitor: async () => {
        // prometheus
        state.intervals.push(setInterval(async () => {
            let api = await Promise.all([
                axios.get('http://127.0.0.1:9090/api/v1/query?query=liquidsoap_is_playing').then(res => res.data || null).catch(err => console.error(err)),
                axios.get('http://127.0.0.1:9090/api/v1/query?query=liquidsoap_is_ready').then(res => res.data || null).catch(err => console.error(err)),
                axios.get('http://127.0.0.1:9090/api/v1/query?query=liquidsoap_is_preferred_livesource').then(res => res.data || null).catch(err => console.error(err))
            ]);

            api = api.map(item => {
                if (item.status !== 'success') return null;
                const data = {};
                item.data.result.forEach(result => {
                    data[`${result.metric.type}.${result.metric.name}`] = (result.value[1] === "1");
                });
                return data;
            });

            state.set('status:prometheus', { playing: api[0], ready: api[1], preferred: api[2] });
        }, 1000 * 10)); //10s

        // docker.liquidsoap
        state.intervals.push(setInterval(async () => {
            const current = await status["docker.liquidsoap"]();
            state.set('status:container:liquidsoap', current);
        }, 1000 * 60 * 1)); //1min
    },
    docker: async () => {
        const command = await exec(`docker container ls --format="{\\"name\\":\\"{{.Names}}\\", \\"status\\":\\"{{.Status}}\\"}" --all | jq --slurp`).catch(console.error);
        if (!command) return [];
        if (command.stderr !== '') {
            console.error(command.stderr);
            return [];
        };
        return JSON.parse(command.stdout);
    },
    "docker.liquidsoap": async () => {
        const { stdout, stderr } = await exec('docker inspect liquidsoap');
        const status = JSON.parse(stdout);
        return {
            id: status[0].Id,
            state: status[0].State
        };
    }
};

module.exports = status;