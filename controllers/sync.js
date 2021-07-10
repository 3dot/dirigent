const exec = require('util').promisify(require('child_process').exec);
const axios = require('axios').default;

const state = require('../services/state');
const setup = require('../config.json');

const client = axios.create({
    baseURL: setup.url,
    headers: { 'x-server-id': setup.server, 'x-server-signature': setup.signature }
});

const getCredentials = () => client.get('/credentials').then(res => res.data);

const sync = async () => {
    state.intervals.push(setInterval(async () => {
        console.log('Sync run');
        const credentials = await getCredentials();
        await exec(`find /home/srt2hls/hls/archive -name *.aac -type f -mmin +720 -delete`).catch(console.error);
        await exec(`find /home/srt2hls/hls/archive -empty -type d -delete`).catch(console.error);
        await exec(`export AWS_ACCESS_KEY_ID=${credentials.key} && export AWS_SECRET_ACCESS_KEY=${credentials.secret} && export AWS_SESSION_TOKEN=${credentials.token} && cd /home/srt2hls/hls/archive && aws s3 sync . s3://cloud.widecast.storage.ingress/${setup.server}/`).catch(console.error);
        console.log('Sync run completed');
    }, 1000 * 60 * 60 * 4));
};

module.exports = sync;