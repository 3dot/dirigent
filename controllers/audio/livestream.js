const exec = require('util').promisify(require('child_process').exec);
const axios = require('axios').default;
const _ = require('lodash');

const state = require('../../services/state');
const docker = require('../../services/docker');

const setup = require('./setup');

const { send } = require('../../services/ws').socket;

const $me = "liquidsoap-hls";
const home = `/home/${$me}`;

const messages = {
    shutdown: async () => {
        send('shutdown:ack', true);
    },
    status: async () => {
        /*const status = state.get('status:liquidsoap');
        send('status', { service: "liquidsoap", status });*/
    },
    update: async () => {
        // update dirigent, restart
        await require('../../services/update')(send);
    },
    config: async () => {
        // download configuration file, restart container
        console.log('Config update, then restart container');
        await setup.fetch.liquidsoap(home);
        await docker.compose.restart(home);
        console.log('Config update completed');
        send('config:ack', { task: +new Date(), done: true });
    },
    sync: async (config) => {
        // forces sync run
        sync(config.server);
    }
};

const monitor = () => {
    // prometheus
    state.intervals.push(setInterval(async () => {
        const api = await Promise.all([
            axios.get('http://127.0.0.1:9090/api/v1/query?query=liquidsoap_is_playing').then(res => res.data || null).catch(err => console.error(err)),
            axios.get('http://127.0.0.1:9090/api/v1/query?query=liquidsoap_is_ready').then(res => res.data || null).catch(err => console.error(err)),
            axios.get('http://127.0.0.1:9090/api/v1/query?query=liquidsoap_is_preferred_livesource').then(res => res.data || null).catch(err => console.error(err))
        ]);
        
        const data = api.map(item => {
            if (item.status !== 'success') return null;
            const data = {};
            item.data.result.forEach(result => {
                data[`${result.metric.type}.${result.metric.name}`] = (result.value[1] === "1");
            });
            return data;
        });

        state.set('metric:prometheus', { playing: data[0], ready: data[1], preferred: data[2] });
    }, 1000 * 10)); //10s

    // docker.liquidsoap
    state.intervals.push(setInterval(async () => {
        const current = await docker.inspect("liquidsoap");
        state.set('status:container:liquidsoap', current);
    }, 1000 * 60 * 1)); //1min
};

const sync = async (server) => {
    console.log('Sync run');
    const credentials = await setup.fetch.credentials();
    await exec(`find ${home}/hls/archive -name *.aac -type f -mmin +720 -delete`).catch(console.error);
    await exec(`find ${home}/hls/archive -empty -type d -delete`).catch(console.error);
    await exec(`export AWS_ACCESS_KEY_ID=${credentials.key} && export AWS_SECRET_ACCESS_KEY=${credentials.secret} && export AWS_SESSION_TOKEN=${credentials.token} && cd ${home}/hls/archive && aws s3 sync . s3://cloud.widecast.storage.ingress/${server}/`).catch(console.error);
    console.log('Sync run completed');
};

module.exports.startup = async (config) => {
    const containers = await docker.overview();
    if (!Array.isArray(containers) || containers.length === 0) {
        // no containers running, run full config
        await setup.fetch.liquidsoap(home);
        await docker.compose.start(home);
        send('status', { ready: true });
    }

    monitor();

    state.intervals.push(setInterval(async () => {
        sync(config.server);
    }, 1000 * 60 * 60 * 4));

    state.intervals.push(setInterval(async () => {
        const data = state.get('status:container:liquidsoap');
        send('status', { container: 'liquidsoap', data });
    }, 1000 * 60 * 5)); //5min

    state.intervals.push(setInterval(async () => {
        const metric = state.get('metric:prometheus');
        if (metric) send('metric', metric);
    }, 1000 * 30)); //30sec

    state.emitter.on('message', data => {
        if (data.constructor !== Object) return;
        if (messages[data.action]) return messages[data.action](config, data.data);
    });

    state.emitter.on('set:status:container:liquidsoap', (key, [oldValue, newValue]) => {
        //console.log(key, [oldValue, newValue]);
        if (!oldValue) {
            //console.log('Liquidsoap running status', newValue.state.Running);
            return send('status', { service: "liquidsoap", running: newValue.state.Running });
        };
        if (oldValue.state.Status !== newValue.state.Status) {
            //console.log('Liquidsoap running status changed', oldValue.state.Running, newValue.state.Running);
            return send('status', { service: "liquidsoap", running: newValue.state.Running });
        }
    });

    state.emitter.on('set:status:prometheus', (key, [oldValue, newValue]) => {
        if (!_.isEqual(newValue, oldValue)) send('status', { service: "prometheus", status: newValue });
    });
};