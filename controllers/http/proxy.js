const exec = require('util').promisify(require('child_process').exec);
const axios = require('axios').default;
const _ = require('lodash');

const common = require('../../services/common');
const state = require('../../services/state');
const docker = require('../../services/docker');

const setup = require('./setup');

const { ws, send } = require('../../services/ws').socket;

const $me = "nginx-proxy";
const home = `/home/${$me}`;

const messages = {
    status: async () => {
        /*const status = state.get('status:prometheus');
        send('status', { service: "prometheus", status });*/
    },
    update: async () => {
        // update dirigent, restart
        await require('../../services/update')(send);
    },
    config: async (data) => {
        // download configuration file
        /*console.log('Download configuration file, restart container');
        await config.fetch.config();
        await config.container.restart('liquidsoap');
        send('config:ack', { task: +new Date(), done: true });*/
    },
    "target.add": async (data) => {
        console.log('Received', 'target.add', data);
        setup.insert(home, { name: data.name, ip: data.ip });
    },
    "target.remove": async (data) => {
        console.log('Received', 'target.remove', data);
        setup.remove(home, { name: data.name });
    }
};

const monitor = () => {
    // prometheus
    /*state.intervals.push(setInterval(async () => {
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
    }, 1000 * 10)); //10s*/

    // docker.liquidsoap
    state.intervals.push(setInterval(async () => {
        const current = await docker.inspect($me);
        state.set(`status:container:${$me}`, current);
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
        await setup.fetch.config(home);
        await docker.compose.start(home);
        send('status', { ready: true });
    }

    monitor();
    sync(config.server);

    state.intervals.push(setInterval(async () => {
        const data = state.get(`status:container:${$me}`);
        send('status', { container: $me, data });
    }, 1000 * 60 * 5)); //5min

    /*ws().on('message', data => {
        if (common.isJson(data)) data = JSON.parse(data);
        if (messages[data.action]) return messages[data.action](data.data);
    });*/

    state.emitter.on('message', data => {
        if (common.isJson(data)) data = JSON.parse(data);
        if (messages[data.action]) return messages[data.action](data.data);
    });

    state.emitter.on(`set:status:container:${$me}`, (key, [oldValue, newValue]) => {
        //console.log(key, [oldValue, newValue]);
        if (!oldValue) {
            //console.log('nginx running status', newValue.state.Running);
            return send('status', { service: $me, running: newValue.state.Running });
        };
        if (oldValue.state.Status !== newValue.state.Status) {
            //console.log('nginx running status changed', oldValue.state.Running, newValue.state.Running);
            return send('status', { service: $me, running: newValue.state.Running });
        }
    });

    state.emitter.on(`set:status:${$me}`, (key, [oldValue, newValue]) => {
        if (!_.isEqual(newValue, oldValue)) send('status', { service: $me, status: newValue });
    });
};