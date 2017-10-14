let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;
let server = require('./server/server');

// Client
// Serve contents of "client" folder on localhost
app.use(express.static('client'));

// Server
server.init(io);

http.listen(port, () => {
    console.log('Listening on port: ' + port);
});