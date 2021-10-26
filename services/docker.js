const exec = require('util').promisify(require('child_process').exec);

module.exports = {
    overview: async () => {
        const { stdout, stderr } = await exec(`docker container ls --format="{\\"name\\":\\"{{.Names}}\\", \\"status\\":\\"{{.Status}}\\"}" --all | jq --slurp`).catch(console.error);
        if (stderr !== '') throw Error(stderr);
        return JSON.parse(stdout || []);
    },
    inspect: async (container) => {
        const { stdout, stderr } = await exec(`docker inspect ${container}`);
        if (stderr !== '') throw Error(stderr);
        const status = JSON.parse(stdout);
        return {
            id: status[0].Id,
            state: status[0].State
        };
    }
};