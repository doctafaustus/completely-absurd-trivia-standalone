// MODULES
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// CONFIG
app.use(express.static(__dirname + '/public'));

// ROUTES
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

// SERVER
http.listen(3000, function() {
	console.log("App listening on port 3000");
});

// SOCKET.IO
var clients = {};
var clientData = {};

io.on('connection', function (socket) {
	//socket.emit('news', { hello: 'world' });

	clients[socket.id] = {};
	clients[socket.id]["name"] = socket.id;
	clients[socket.id]["score"] = 0;

	function rankPlayers() {
		var sortedClients = [];
		for (var key in clients) {
			sortedClients.push(clients[key]);
		}

		sortedClients.sort(function(a, b){
		    return b.score - a.score;
		});

		var rank = 1;
		for (var i = 0; i < sortedClients.length; i++) {
			if (i > 0 && sortedClients[i].score < sortedClients[i - 1].score) {
				rank++;
			}
			
			sortedClients[i].rank = rank;
		}
	}

	rankPlayers();

	socket.emit('initialize', { clients:  clients});


	console.log(clients);
});


