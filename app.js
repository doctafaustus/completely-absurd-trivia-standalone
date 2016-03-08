// MODULES
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require("request");

// CONFIG
app.use(express.static(__dirname + '/public'));
request({
    	url: "https://raw.githubusercontent.com/doctafaustus/awa/master/imagedata.json",
    	json: true
	}, function (error, response, body) {
	    if (!error && response.statusCode === 200) {
	        console.log(body) // Print the json response
	    }
})

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

	// Create a clients object that contains each player as a subobject
	clients[socket.id] = {};
	clients[socket.id]["name"] = socket.id.substring(0, 8);
	clients[socket.id]["score"] = 0;
	clients[socket.id]["streak"] = 0;
	clients[socket.id]["accuracy"] = 100;

	// Rank players
	function rankPlayers() {

		var playerData = {};

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

		// Generate leaderboard
		var leaderboard = "<table id='leaderboard-list'>";
		for (var i = 0; i < sortedClients.length; i++) { 
			if (i < 5) {
			  leaderboard += "<tr>" + "<td class='leaderboard-rank'>" + sortedClients[i].rank + "." + "</td>" + "<td class='leaderboard-score'>" + 
			  sortedClients[i].score + "</td>" + "<td class='leaderboard-user'>" + sortedClients[i].name + "</td>" + "<tr/>"; 
			} else {
				break;
			}
		} 
		leaderboard += "</table>";
		playerData.leaderboard = leaderboard;


		// Generate Most Points
		var highestScore = Math.max.apply(Math,sortedClients.map(function(o){return o.score;}));
		console.log("Highest Score: " + highestScore);
		var highestScorePlayer = "";
		for (var i = 0; i < sortedClients.length; i++) {
			if (sortedClients[i].score === highestScore) {
				highestScorePlayer = sortedClients[i].name;
				break;
			}
		}
		playerData.highestScoreData = {};
		playerData.highestScoreData.highestScorePlayer = highestScorePlayer;
		playerData.highestScoreData.highestScoreNumber = highestScore;

		// Generate Correct %
		var highestAccuracy = Math.max.apply(Math,sortedClients.map(function(o){return o.accuracy;}));
		console.log("Highest Acccuracy: " + highestAccuracy);
		var highestAccuracyPlayer = "";
		for (var i = 0; i < sortedClients.length; i++) {
			if (sortedClients[i].accuracy === highestAccuracy) {
				highestAccuracyPlayer = sortedClients[i].name;
				break;
			}
		}
		playerData.highestAccuracyData = {};
		playerData.highestAccuracyData.highestAccuracyPlayer = highestAccuracyPlayer;
		playerData.highestAccuracyData.highestAccuracyNumber = highestAccuracy;

		// Generate Best Streak
		var highestStreak = Math.max.apply(Math,sortedClients.map(function(o){return o.streak;}));
		console.log("Highest Streak: " + highestStreak);
		var highestStreakPlayer = "";
		for (var i = 0; i < sortedClients.length; i++) {
			if (sortedClients[i].streak === highestStreak) {
				highestStreakPlayer = sortedClients[i].name;
				break;
			}
		}
		playerData.highestStreakData = {};
		playerData.highestStreakData.highestStreakPlayer = highestStreakPlayer;
		playerData.highestStreakData.highestStreakNumber = highestStreak;


		// Generate Goat of the Game
		var goat = sortedClients[Math.floor(Math.random() * sortedClients.length)];
		playerData.goat = goat.name;






		return playerData;
	}





	socket.emit('initialize', { clients:  clients});


    socket.on('getRanks', function(socket) {
    	console.log("Getting ranks...");

		var playerData = rankPlayers();
		io.emit('playersRanked', {playerData: playerData});
	});

	console.log("CLIENTS: " + Object.keys(clients).length);
	console.log(clients);

});

