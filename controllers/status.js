const spawn = require('util').promisify(require('child_process').spawn);

module.exports = {
    "docker.liquidsoap": async () => {
        const { stdout, stderr } = await spawn('docker inspect liquidsoap');
        console.log({ stdout, stderr });
        if (stdout) {
            return JSON.parse(stdout);
        }
    }
};