const config = require('./config');

const controllers = {
    status: require('./status'),
    config: require('./config')
};

const isJson = (item) => {
    item = typeof item !== "string"
        ? JSON.stringify(item)
        : item;

    try {
        item = JSON.parse(item);
    } catch (e) {
        return false;
    }

    if (typeof item === "object" && item !== null) {
        return true;
    }

    return false;
};

const service = (ws, cleanup) => {
    let status, ping = false;

    const send = (action, data = Date.now()) => {
        console.log('Sending message', JSON.stringify({ action, data }, null, 2));
        ws.send(JSON.stringify({ action, data }));
    };

    const messages = {
        config: async (data) => {
            // download configuration file, restart container
            await config.fetch.liquidsoap();
            return config.container.restart('liquidsoap');
        },
        status: async (data) => {
            // report container status
            if (data === "docker.liquidsoap") {
                const status = controllers.status[data];
                send('status', { for: data, data: status });
            } else {
                const status = controllers.status["docker"];
                send('status', { for: "docker", data: status });
            }
        },
        start: async (data) => {
            await config.compose.start();
        },
        restart: async (data) => {
            await config.compose.restart();
        },
        stop: async (data) => {
            await config.compose.stop();
        }
    };

    ws.on('open', async () => {
        console.log('Connected');
        status = true;

        const service = controllers.status["docker"]().then(res => controllers.config.startup(res));
        cleanup.push(service);

        ping = setInterval(() => {
            // keepalive 5min
            if (status) send('ping');
        }, 1000 * 60 * 5);
    });

    ws.on('close', () => {
        console.log('Disconnected');
        status = false;
        clearInterval(ping);
    });

    ws.on('message', data => {
        console.log('Received message', data);
        if (isJson(data)) data = JSON.parse(data);
        if (messages[data.action]) return messages[data.action](data.data);
        console.log('No handler available');
    });
};

module.exports = service;