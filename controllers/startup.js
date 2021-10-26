const _ = require('lodash');

const state = require('../services/state');

const { ws, send } = require('../services/ws').socket;

module.exports = async (config) => {
    try {
        require(`./${config.service}`).startup(config);
    } catch(err) {
        console.error(err);
    }
};

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