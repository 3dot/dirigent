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

const service = ws => {
    const send = (ws) => ((action, data) => {
        console.log('Sending message', JSON.stringify({ action, data }, null, 2));
        ws.send(JSON.stringify({ action, data }));
    })(ws);

    const messages = {
        config: async (data) => {
            // download configuration file, restart container
        },
        status: async (data) => {
            // report container status
            if (data === "docker.liquidsoap") {
                const status = controllers.status[data];
                send('status', status);
            }
        }
    };

    ws.on('open', () => {
        console.log('Connected');
    });

    ws.on('close', () => {
        console.log('Disconnected');
    });

    ws.on('message', data => {
        console.log('Received message', data);
        if (isJson(data)) data = JSON.parse(data);
        if (messages[data.action]) return messages[data.action](data.data);
        console.log('No handler available');
    });
};

module.exports = service;