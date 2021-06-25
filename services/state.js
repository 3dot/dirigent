const events = require('events');
const emitter = new events.EventEmitter();

const storage = {
    containers: []
};

module.exports = {
    get: (key) => {
        return storage[key];
    },
    set: (key, value) => {
        emitter.emit(`set:${key}`, key, [storage[key], value]);
        storage[key] = value;
        return value;
    },
    delete: (key) => {
        emitter.emit(`delete:${key}`, key);
        delete storage[key];
    },
    timeouts: [],
    intervals: [],
    emitter
};