const exec = require('util').promisify(require('child_process').exec);

module.exports = async (send) => {
    await exec(`cd /home/dirigent && git reset --hard HEAD && git clean -df && git pull && yarn install`).catch(console.error);
    await send('update:ack', { task: +new Date(), done: true });
    process.kill(process.pid, 'SIGTERM');
};