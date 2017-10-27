let express = require('express');
let app = express();
let http = require('http');
let httpServer = http.Server(app);
let io = require('socket.io')(httpServer);
let Server = require('./server/Server');

// Client
// Serve contents of "client" or "dist" folder
let client_path = (typeof process.env.DIST !== 'undefined') ? 'dist' : 'client';
console.log('Client path: ' + client_path);
app.use(express.static(client_path));

// Server
let server = new Server(io);

let port = process.env.PORT || 3000;
httpServer.listen(port, () => {
    console.log('Listening on port: ' + port);
});

// Avoid heroku server idling
if (typeof process.env.DIST !== 'undefined'){
    setInterval(() => {
        http.get('http://game753.herokuapp.com/');
    }, 1800000);
}


// Link Previews Test
/*
let https = require('https');
let url = 'https://www.youtube.com/playlist?list=PLV6LfYRzz4V6n4KWOHUPE8LXNodAFEO6c';
https.get(url, (res) => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      console.log(body);
    });
});*/