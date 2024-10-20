let express = require('express');
let app = express();
let http = require('http');
let httpServer = http.Server(app);
let io = require('socket.io')(httpServer, {
    // Change Chat.js value too if modifying file size
    maxHttpBufferSize: 300 * 1024 * 1024, // 300MB
    cors: {
        origin: "http://localhost:5173",  // Replace with your client’s address
        methods: ["GET", "POST"]
    }
});
let Server = require('./src/Server');

// Server
let server = new Server(io);

let port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log('Listening on port: ' + port);
});

// Avoid server idling
if (typeof process.env.APP_URL !== 'undefined'){
    setInterval(() => {
        http.get(process.env.APP_URL);
    }, 13 * 60 * 1000);
}
