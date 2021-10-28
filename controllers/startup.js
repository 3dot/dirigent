const _ = require('lodash');

module.exports = async (config) => {
    try {
        require(`./${config.service.replace('.', '/')}`).startup(config);
    } catch(err) {
        console.error(err);
    }
};