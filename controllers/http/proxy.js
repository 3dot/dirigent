const exec = require('util').promisify(require('child_process').exec);
const _ = require('lodash');

const state = require('../../services/state');
const docker = require('../../services/docker');

const setup = require('./setup');

const { send } = require('../../services/ws').socket;

const $me = "nginx-proxy";
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
    // docker.nginx
    state.intervals.push(setInterval(async () => {
        const current = await docker.inspect($me);
        state.set(`status:container:${$me}`, current);
    }, 1000 * 60 * 1)); //1min
};

const credentialsrefresh = async (server) => {
    console.log('Credentials refresh run');
    const credentials = await setup.fetch.credentials();
    const config = `[default]
aws_access_key_id=${credentials.key}
aws_secret_access_key=${credentials.secret}
aws_session_token=${credentials.token}`;
    await exec(`echo '${config}' | tee ~/.aws/credentials > /dev/null`).catch(console.error);
    console.log('Credentials refresh completed');
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
    
    state.intervals.push(setInterval(async () => {
        credentialsrefresh(config.server);
    }, 1000 * 60 * 55)); //55min

    state.intervals.push(setInterval(async () => {
        const data = state.get(`status:container:${$me}`);
        send('status', { container: $me, data });
    }, 1000 * 60 * 5)); //5min

    /*ws().on('message', data => {
        if (common.isJson(data)) data = JSON.parse(data);
        if (messages[data.action]) return messages[data.action](data.data);
    });*/

    state.emitter.on('message', data => {
        if (data.constructor !== Object) return;
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