const spawn = require('util').promisify(require('child_process').spawn);

module.exports = {
    docker: async () => {
        const { stdout, stderr } = await spawn('docker container ls --format="{\"name\":\"{{.Names}}\", \"status\":\"{{.Status}}\"}" --all | jq --slurp');
        console.log({ stdout, stderr });
        if (stdout) return { list: JSON.parse(stdout) };
        return {
            list: []
        }
    },
    "docker.liquidsoap": async () => {
        const { stdout, stderr } = await spawn('docker inspect liquidsoap');
        console.log({ stdout, stderr });
        if (stdout) {
            return JSON.parse(stdout);
        }
    }
};