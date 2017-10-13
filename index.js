let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

// Client
// Serve contents of "client" folder on localhost
app.use(express.static('client'));

// Server
io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (chatMsg) => {
        console.log(chatMsg.player + ': ' + chatMsg.msg);
        socket.broadcast.emit('chat message', chatMsg);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

http.listen(port, () => {
    console.log('listening on *: ' + port);
});