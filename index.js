let express = require('express');
let app = express();
let http = require('http');
let httpServer = http.Server(app);
let io = require('socket.io')(httpServer);
let server = require('./server/server');

// Client
// Serve contents of "client" or "dist" folder
let client_path = (typeof process.env.DIST !== 'undefined') ? 'dist' : 'client';
console.log('Client path: ' + client_path);
app.use(express.static(client_path));

// Server
server.init(io);

let port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log('Listening on port: ' + port);
});

// Avoid heroku server idling
setInterval(() => {
    http.get('http://game753.herokuapp.com/');
}, 1800000)