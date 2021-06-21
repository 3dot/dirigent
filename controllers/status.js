const exec = require('util').promisify(require('child_process').exec);

const status = {
    monitor: async () => {
        let interval = setInterval(async () => {
            const current = await status["docker.liquidsoap"]();
            console.log(current);
        }, 10 * 1000);
        return interval;
    },
    docker: async () => {
        const { stdout, stderr } = await exec(`docker container ls --format="{\\"name\\":\\"{{.Names}}\\", \\"status\\":\\"{{.Status}}\\"}" --all | jq --slurp`).catch(err => console.error(err));
        if (stderr !== '') {
            console.error(stderr);
            return {
                list: []
            };
        };
        return { list: JSON.parse(stdout) };
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