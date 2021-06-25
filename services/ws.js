const WebSocket = require('ws');

let queue = [];
let socket;
let status = [false, null];
let response = {
    status: () => status,
    ws: () => socket,
    close: () => socket.close(),
    send: (channel, message) => {
        if (response.status()[0]) return socket.send(JSON.stringify({ action: channel, data: message }));
        queue.push([channel, message]);
    }
};

module.exports.init = ({ ws, server, signature }) => {
    const url = `${ws}/?server=${server}&signature=${signature}`;
    console.log('Connecting', url);
    socket = new WebSocket(url);

    socket.on('open', async () => {
        console.log('Connected');
        status = [true, +new Date()];
        if (queue.length !== 0) {
            queue.forEach(item => socket.send(JSON.stringify({ action: item[0], data: item[1] })));
            queue = [];
        };
    });
    socket.on('close', () => {
        console.log('Disconnected');
        status = [false, +new Date()];
    });

    socket.on('message', data => {
        console.log('Received message', data);
    });

    return response;
};
module.exports.socket = response;