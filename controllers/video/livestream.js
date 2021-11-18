const exec = require('util').promisify(require('child_process').exec);
const axios = require('axios').default;
const _ = require('lodash');
const xml2js = require('xml2js');

const state = require('../../services/state');
const docker = require('../../services/docker');

const setup = require('./setup');

const { send } = require('../../services/ws').socket;

const $me = "nginxffmpeg";
const home = `/home/${$me}`;

const messages = {
    shutdown: async () => {
        send('shutdown:ack', true);
    },
    status: async () => {
        /*const status = state.get('status:prometheus');
        send('status', { service: "prometheus", status });*/
    },
    update: async () => {
        // update dirigent, restart
        await require('../../services/update')(send);
    },
    config: async (data) => {
        // download configuration file, restart container
        /*console.log('Download configuration file, restart container');
        await config.fetch.config();
        await config.container.restart('liquidsoap');
        send('config:ack', { task: +new Date(), done: true });*/
    }
};

const monitor = () => {
    // nginx
    state.intervals.push(setInterval(async () => {
        const metric = await axios.get('http://127.0.0.1:8080/stat').then(res => res.data || null).catch(err => console.error(err));
        const data = await new xml2js.Parser({ explicitArray: false }).parseStringPromise(metric);

        state.set('status:nginx', data);
    }, 1000 * 15)); //10s

    // docker.liquidsoap
    state.intervals.push(setInterval(async () => {
        const current = await docker.inspect("nginx-rtmp");
        state.set('status:container:nginx-rtmp', current);
    }, 1000 * 60 * 1)); //1min
};

const sync = (server) => {
    /*state.intervals.push(setInterval(async () => {
        console.log('Sync run');
        const credentials = await client.get('/credentials').then(res => res.data);
        await exec(`find ${home}/hls/archive -name *.aac -type f -mmin +720 -delete`).catch(console.error);
        await exec(`find ${home}/hls/archive -empty -type d -delete`).catch(console.error);
        await exec(`export AWS_ACCESS_KEY_ID=${credentials.key} && export AWS_SECRET_ACCESS_KEY=${credentials.secret} && export AWS_SESSION_TOKEN=${credentials.token} && cd ${home}/hls/archive && aws s3 sync . s3://cloud.widecast.storage.ingress/${server}/`).catch(console.error);
        console.log('Sync run completed');
    }, 1000 * 60 * 60 * 4));*/
};

module.exports.startup = async (config) => {
    const containers = await docker.overview();
    if (!Array.isArray(containers) || containers.length === 0) {
        // no containers running, run full config
        await setup.fetch.nginx(home);
        await docker.compose.start(home);
        send('status', { ready: true });
    }

    monitor();
    sync(config.server);

    state.intervals.push(setInterval(async () => {
        const data = state.get('status:container:nginx-rtmp');
        send('status', { container: 'nginx-rtmp', data });
    }, 1000 * 60 * 5)); //5min

    state.intervals.push(setInterval(async () => {
        const metric = state.get('metric:nginx');
        if (metric) send('metric', metric);
    }, 1000 * 15)); //15sec

    state.emitter.on('message', data => {
        if (data.constructor !== Object) return;
        if (messages[data.action]) return messages[data.action](data.data);
    });

    state.emitter.on('set:status:container:nginx-rtmp', (key, [oldValue, newValue]) => {
        //console.log(key, [oldValue, newValue]);
        if (!oldValue) {
            //console.log('nginx running status', newValue.state.Running);
            return send('status', { service: "nginx-rtmp", running: newValue.state.Running });
        };
        if (oldValue.state.Status !== newValue.state.Status) {
            //console.log('nginx running status changed', oldValue.state.Running, newValue.state.Running);
            return send('status', { service: "nginx-rtmp", running: newValue.state.Running });
        }
    });

    state.emitter.on('set:status:nginx-rtmp', (key, [oldValue, newValue]) => {
        if (!_.isEqual(newValue, oldValue)) send('status', { service: "nginx-rtmp", status: newValue });
    });
};