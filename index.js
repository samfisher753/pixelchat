let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let server = require('./server/server');

// Client
// Serve contents of "client" or "dist" folder
let client_path = (typeof process.env.DIST !== 'undefined') ? 'dist' : 'client';
console.log('Client path: ' + client_path);
app.use(express.static(client_path));

// Server
server.init(io);

let port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log('Listening on port: ' + port);
});