const _ = require('lodash');

const state = require('../services/state');

module.exports = async (config) => {
    try {
        require(`./${config.service.replace('.', '/')}`).startup(config);
    } catch(err) {
        console.error(err);
    }
};

state.emitter.on('message', data => {
    if (data.constructor !== Object) return;
});