const exec = require('util').promisify(require('child_process').exec);
const state = require('../services/state');

const status = {
    monitor: async () => {
        state.intervals.push(setInterval(async () => {
            const current = await status["docker.liquidsoap"]();
            state.set('container:liquidsoap', current);
        }, 10 * 1000));
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