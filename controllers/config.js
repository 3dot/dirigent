const spawn = require('util').promisify(require('child_process').spawn);

module.exports = {
    compose: async (data) => {
        // prepare config
    },
    liquidsoap: async (data) => {
        // fetch config file, replace existing, restart container
    }
};