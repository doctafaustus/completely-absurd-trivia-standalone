// MODULES
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require("request");

// CONFIG
app.use(express.static(__dirname + '/public'));
var questionData;
request({
    	url: "https://raw.githubusercontent.com/doctafaustus/Completely-Absurd-Trivia/master/questions.json",
    	json: true
	}, function (error, response, body) {
	    if (!error && response.statusCode === 200) {
	        // console.log(body) // Print the json response
	        questionData = body;
	    }
})
var currentQuestion;
var currentQuestionID;
var currentQuestionAnswer;
var currentQuestionPointValue;
var questionsAsked = 0;
var answersByPlayers = {
	"a": 0,
	"b": 0,
	"c": 0,
	"d": 0,
	"No answer": 0
};

var badges = {
	firstPlace: {
		title: "1st Place",
		href: "badges/1st-place-badge.png"
	},
  	secondPlace: {
  		title: "2nd Place",
  		href: "badges/2nd-place-badge.png"
  	},
  	thirdPlace: {
  		title: "3rd Place",
  		href: "badges/3rd-place-badge.png"
  	},
  	threeStreak: {
  		title: "3x Streak",
  		href: "badges/3x-badge.png"
  	},
  	fiveStreak: {
  		title: "5x Streak",
  		href: "badges/5x-badge.png"
  	},
  	tenStreak: {
  		title: "10x Streak",
  		href: "badges/10x-badge.png"
  	},
  	fifteenStreak: {
  		title: "15x Streak",
  		href: "badges/15x-badge.png"
  	},
  	seventyFiveAccuracy: {
  		title: "On Point",
  		href: "badges/75-percent-accuracy-badge.png"
  	},
  	firstGame: {
  		title: "Newbie",
  		href: "badges/first-game-badge.png"
  	},
  	goatOfTheGame: {
  		title: "Goat of the Game",
  		"href": "badges/goat-of-the-game-badge.png"
  	},
  	highestAccuracy: {
  		title: "Poindexter",
  		href: "badges/highest-accuracy-badge.png"
  	},
  	highestStreak: {
  		title: "On Fire",
  		href: "badges/highest-streak-badge.png"
  	},
  	loser: {
  		title: "Total Loser",
  		href: "badges/loser-badge.png"
  	},
  	perfectGame: {
  		title: "Hail to the Chief",
  		href: "badges/perfect-game-badge.png"
  	},
  	topTen: {
  		title: "Elitist",
  		href: "badges/top-ten-badge.png"
  	},
  	category1: {
  		title: "Disgusting Food Master",
  		href: "badges/disgusting-food-badge.png"
  	},
  	category2: {
  		title: "Hot Pot Master",
  		href: "badges/hot-pot-badge.png"
  	},
  	category3: {
  		title: "Pics of Your Mom Master",
  		href: "badges/pics-of-your-mom-badge.png"
  	},
  	category4: {
  		title: "Memes Master",
  		href: "badges/memes-badge"
  	}

};


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
	clients[socket.id]["questionsAnswered"] = 0;
	clients[socket.id]["questionsCorrect"] = 0;
	clients[socket.id]["currentQuestionCorrect"] = false;
	clients[socket.id]["badges"] = [];
	//clients[socket.id]["rank"] = 0;

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


		// Generate chart 2 data
		var pointLevels = {
			"l_0-499": 0,
			"l_500-999": 0,
			"l_1000-1999": 0,
			"l_2000-2999": 0,
			"l_3000-3999": 0,
			"l_4000-4999": 0,
			"l_5000+": 0
		};

		for (var i = 0; i < sortedClients.length; i++) {
			if (sortedClients[i].score <= 499) {
				pointLevels["l_0-499"]++;
			} else if (sortedClients[i].score <= 999) {
				pointLevels["l_500-999"]++;
			} else if (sortedClients[i].score <= 1999) {
				pointLevels["l_1000-1999"]++;
			} else if (sortedClients[i].score <= 2999) {
				pointLevels["l_2000-2999"]++;
			} else if (sortedClients[i].score <= 3999) {
				pointLevels["l_3000-3999"]++;
			} else if (sortedClients[i].score <= 4999) {
				pointLevels["l_4000-4999"]++;
			} else if (sortedClients[i].score >= 5000) {
				pointLevels["l_5000+"]++;
			}
		}

		// Convert pointLevels values into an array that's usable for chart 2
		var levels = [];
		for (key in pointLevels) {
			levels.push(pointLevels[key]);
		}

		playerData.chart2 = levels.reverse();


		return playerData;
	}


	socket.emit('initialize', { clients:  clients, questionData: questionData});

	console.log("CLIENTS: " + Object.keys(clients).length);
	//console.log(clients);

	// Manual get ranks
    socket.on('getRanks', function(socket) {
    	console.log("Getting ranks...");
		var playerData = rankPlayers();
		io.emit('playersRanked', {playerData: playerData});
	});

	// Get individual scores
	socket.on('getIndividualScores', function() {
		var individualData = {
			score: clients[socket.id]["score"],
			streak: clients[socket.id]["streak"],
			accuracy: clients[socket.id]["accuracy"],
			rank: clients[socket.id]["rank"],
			totalPlayers: Object.keys(clients).length,
			currentQuestionID: currentQuestionID,
			currentQuestionCorrect: clients[socket.id]["currentQuestionCorrect"],
			currentQuestionAnswer: currentQuestionAnswer,
			currentQuestionPointValue: currentQuestionPointValue
		};

		socket.emit('showIndividualScores', individualData);
	});

	// Trigger question
	socket.on('questionTriggered', function(questionID) {
		console.log("Question triggered...");
		// Reset answersByPlayers
		answersByPlayers = {
			"a": 0,
			"b": 0,
			"c": 0,
			"d": 0,
			"No answer": 0
		};

		io.emit('questionPresented', {question: questionData[questionID], questionNum: questionsAsked });
		currentQuestion = questionData[questionID];
		currentQuestionID = questionID;
		currentQuestionAnswer = currentQuestion["answer"];
		questionsAsked += 1;
		// Get question point value by adding 00 to end of the last character in the question id
		currentQuestionPointValue = currentQuestionID[currentQuestionID.length - 1];
		currentQuestionPointValue = Number(currentQuestionPointValue + "00");

		// Automatic Get Ranks 3 seconds after local question time has ended
		setTimeout(function() {
	    	console.log("Getting ranks...");
			var playerData = rankPlayers();

			// Put answersByPlayers into an array so it's usable for Highcharts
			var answers = [];
			for (key in answersByPlayers) {
				answers.push(answersByPlayers[key]);
			}

			// Determine what position in the color array should hold the pink color for the answer
			var colors = ['#1797FF', '#1797FF', '#1797FF', '#1797FF', '#1797FF'];
			var position;
			switch (currentQuestion["answer"]) {
				case "a":
					position = 0;
					break;
				case "b":
					position = 1;
					break;
				case "c":
					position = 2;
					break;
				case "d":
					position = 3;
					break;
			}
			colors[position] = "#FD00AF";

			// Generate chart 1 data
			var chart1 = {
				title: currentQuestion["q"],
				categories: [currentQuestion["a"], currentQuestion["b"], currentQuestion["c"], currentQuestion["d"], "No answer"],
				questionsAsked: questionsAsked,
				answersByPlayers: answers,
				colors: colors
			};


			io.emit('playersRanked', {playerData: playerData, extraData: { chart1: chart1 } });
		}, 8500);
	});

	// Answer question
	socket.on('answerGuessed', function(submittedAnswer, fastAnswer) {
		clients[socket.id]["questionsAnswered"] += 1;
		if (submittedAnswer === currentQuestion.answer) {
			console.log("Correct!");
			clients[socket.id]["questionsCorrect"] += 1;
			clients[socket.id]["score"] += currentQuestionPointValue;
			clients[socket.id]["streak"] += 1;
			clients[socket.id]["currentQuestionCorrect"] = true;
			if (fastAnswer) {
				clients[socket.id]["score"] += 50;
			}
		} else {
			console.log("Incorrect");
			clients[socket.id]["streak"] = 0;
			clients[socket.id]["currentQuestionCorrect"] = false;
		}
		clients[socket.id]["accuracy"] = (clients[socket.id]["questionsCorrect"] / clients[socket.id]["questionsAnswered"] * 100).toFixed(0);

		// Keep track of guessed answer for chart 1
		if (submittedAnswer === null) {
			answersByPlayers["No answer"]++;
		} else {
			answersByPlayers[submittedAnswer]++;
		}

	});


	// Incoming message
	socket.on("send-message", function(message) {
		io.emit("incoming-message", message);
	});

	// Incoming admin message
    socket.on("admin-send-message", function(message) {
    	io.emit("admin-incoming-message", message);
    });

    // Show admin message (in case of late arrivals)
    socket.on("admin-hide-triggered", function() {
    	io.emit("admin-hide");
    });


	// Remove client form clients object on disconnect
    socket.on('disconnect', function() {
        console.log(socket.id + " disconnected");
        delete clients[socket.id];
    });

    // End game
    socket.on("end-game", function() {
    	// Assign badges
    	// 1st Place

    });

});

