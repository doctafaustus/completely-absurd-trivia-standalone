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
});
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
		href: "badges/1st-place-badge.png",
		description: "Score the most points in a game"
	},
  	secondPlace: {
  		title: "2nd Place",
  		href: "badges/2nd-place-badge.png",
  		description: "Score the second most points in a game"
  	},
  	thirdPlace: {
  		title: "3rd Place",
  		href: "badges/3rd-place-badge.png",
  		description: "Score the thrid most points in a game"
  	},
  	seventyFiveAccuracy: {
  		title: "On Point",
  		href: "badges/75-percent-accuracy-badge.png",
  		description: "Finish a game with over 75% accuracy"
  	},
  	firstGame: {
  		title: "Newbie",
  		href: "badges/first-game-badge.png",
  		description: "Play your first game"
  	},
  	goatOfTheGame: {
  		title: "Goat of the Game",
  		"href": "badges/goat-of-the-game-badge.png",
  		description: "Baaaah!"
  	},
  	highestAccuracy: {
  		title: "Poindexter",
  		href: "badges/highest-accuracy-badge.png",
  		description: "Finish a game with the highest accuracy of any player"
  	},
  	highestStreak: {
  		title: "On Fire",
  		href: "badges/highest-streak-badge.png",
  		description: "Finish a game with the highest streak of any player"
  	},
  	loser: {
  		title: "Total Loser",
  		href: "badges/loser-badge.png",
  		description: "Answer no questions correctly"
  	},
  	perfectGame: {
  		title: "Hail to the Chief",
  		href: "badges/perfect-game-badge.png",
  		description: "Answer every single question correctly"
  	},
  	topTen: {
  		title: "Elitist",
  		href: "badges/top-ten-badge.png",
  		description: "Rank in the top ten"
  	},
  	threeStreak: {
  		title: "3x Streak",
  		href: "badges/3x-badge.png",
  		description: "Correctly answer 3 questions in a row"
  	},
  	fiveStreak: {
  		title: "5x Streak",
  		href: "badges/5x-badge.png",
  		description: "Correctly answer 5 questions in a row"
  	},
  	tenStreak: {
  		title: "10x Streak",
  		href: "badges/10x-badge.png",
  		description: "Correctly answer 10 questions in a row."
  	},
  	fifteenStreak: {
  		title: "15x Streak",
  		href: "badges/15x-badge.png",
  		description: "Correctly answer 15 questions in a row"
  	},
  	category1: {
  		title: "Hot Pot Master",
  		href: "badges/hot-pot-badge.png",
  		description: "Get all questions right in this category"
  	},
  	category2: {
  		title: "Pics of Your Mom Master",
  		href: "badges/pics-of-your-mom-badge.png",
  		description: "Get all questions right in this category"
  	},
  	category3: {
  		title: "Disgusting Food Master",
  		href: "badges/disgusting-food-badge.png",
  		description: "Get all questions right in this category"
  	},
  	category4: {
  		title: "Memes Master",
  		href: "badges/memes-badge",
  		description: "Get all questions right in this category"
  	}

};


// ROUTES
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/landing', function(req, res) {
	res.sendFile(__dirname + '/landing.html');
});

app.get('/home', function(req, res) {
	res.sendFile(__dirname + '/home.html');
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
	clients[socket.id] = {
		name: socket.id.substring(0, 8),
		score: 0,
		streak: 0,
		highStreak: 0,
		accuracy: 100,
		questionsAnswered: 0,
		questionsCorrect: 0,
		currentQuestionCorrect: false,
		badges: [],
		cat1: 0,
		cat2: 0,
		cat3: 0,
		cat4: 0
	};
	//clients[socket.id]["rank"] = 0;

	// Rank players
	function rankPlayers(endGame) {

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
			  sortedClients[i].score + "</td>" + "<td class='leaderboard-user'>" + sortedClients[i].name + "</td>" + "</td><tr/>"; 
			} else {
				break;
			}
		} 
		leaderboard += "</table>";
		playerData.leaderboard = leaderboard;


		// Generate Most Points
		var highestScore = Math.max.apply(Math,sortedClients.map(function(o){return o.score;}));
		var highestScorePlayer = "";
		for (var i = 0; i < sortedClients.length; i++) {
			if (sortedClients[i].score === highestScore) {
				highestScorePlayer = sortedClients[i];
				break;
			}
		}
		playerData.highestScoreData = {};
		playerData.highestScoreData.highestScorePlayer = highestScorePlayer.name;
		playerData.highestScoreData.highestScoreNumber = highestScore;

		// Generate Correct %
		var highestAccuracy = Math.max.apply(Math,sortedClients.map(function(o){return o.accuracy;}));
		var highestAccuracyPlayer = "";
		for (var i = 0; i < sortedClients.length; i++) {
			if (sortedClients[i].accuracy == highestAccuracy) {
				highestAccuracyPlayer = sortedClients[i].name;
				break;
			}
		}
		playerData.highestAccuracyData = {};
		playerData.highestAccuracyData.highestAccuracyPlayer = highestAccuracyPlayer;
		playerData.highestAccuracyData.highestAccuracyNumber = highestAccuracy;

		// Generate Best Streak
		var highestStreak = Math.max.apply(Math,sortedClients.map(function(o){return o.streak;}));
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

		if (endGame) {
			var resultTable = "";

			// Assign badges
			for (var i = 0; i < sortedClients.length; i++) {
				if (sortedClients[i].rank === 1) { // 1st Place
					sortedClients[i].badges.push(badges.firstPlace);
				} 
				if (sortedClients[i].rank === 2) { // 2nd Place
					sortedClients[i].badges.push(badges.secondPlace);
				}
				if (sortedClients[i].rank === 3) { // 3rd Place
					sortedClients[i].badges.push(badges.thirdPlace);
				}
				if (sortedClients[i].highStreak >= 3) { // 3x Streak
					sortedClients[i].badges.push(badges.threeStreak);
				}
				if (sortedClients[i].highStreak >= 5) { // 5x Streak
					sortedClients[i].badges.push(badges.fiveStreak);
				}
				if (sortedClients[i].highStreak >= 10) { // 10x Streak
					sortedClients[i].badges.push(badges.tenStreak);
				}
				if (sortedClients[i].highStreak >= 15) { // 15x Streak
					sortedClients[i].badges.push(badges.fifteenStreak);
				}
				if (sortedClients[i].accuracy >= 75) { // 75%+ Accuracy
					sortedClients[i].badges.push(badges.seventyFiveAccuracy);
				}
				if (sortedClients[i].name == goat.name) { // Goat of the Game
					goat.badges.push(badges.goatOfTheGame);
				}
				if (sortedClients[i].score === 0) { // Loser
					sortedClients[i].badges.push(badges.loser);
				}
				if (sortedClients[i].questionsCorrect === 20) { // Perfect Game
					sortedClients[i].badges.push(badges.perfectGame);
				}
				if (sortedClients[i].rank > 3 && sortedClients[i].rank < 11) { // Top Ten
					sortedClients[i].badges.push(badges.topTen);
				}
				if (sortedClients[i].accuracy === highestAccuracy) { // Highest Accuracy
					sortedClients[i].badges.push(badges.highestAccuracy);
				}
				if (sortedClients[i].streak === highestStreak) { // Highest Streak
					sortedClients[i].badges.push(badges.highestStreak);
				}
				if (sortedClients[i].cat1 === 5) { // Category 1
					sortedClients[i].badges.push(badges.category1);
				}
				if (sortedClients[i].cat2 === 5) { // Category 2
					sortedClients[i].badges.push(badges.category2);
				}
				if (sortedClients[i].cat3 === 5) { // Category 3
					sortedClients[i].badges.push(badges.category3);
				}
				if (sortedClients[i].cat4 === 5) { // Category 4
					sortedClients[i].badges.push(badges.category4);
				}
				var userBadges = "";
				for (j = 0; j < sortedClients[i].badges.length; j++) {
					console.log(sortedClients[i].badges[j]);
					userBadges += "<div class='badge-info'><div class='badge-description-table'>" + sortedClients[i].badges[j].description + "</div><img class='badge' src='" + sortedClients[i].badges[j].href + "'></div>";
				}

				// First Game Badge Needed
				resultTable += 	"<tr>\
									<td>" + sortedClients[i].rank + "</td>\
									<td>" + sortedClients[i].name + "</td>\
									<td>" + sortedClients[i].score + "</td>\
									<td>" + sortedClients[i].highStreak + "</td>\
									<td>" + sortedClients[i].accuracy + "%</td>\
									<td><div class='badge-div'><div class='badge-hover-over'>test</div>" + userBadges + "</div></td>\
								</tr>";
			}

			return resultTable;

		} else {
			return playerData;
		}

	}


	socket.emit('initialize', { clients:  clients, questionData: questionData});

	console.log("CLIENTS: " + Object.keys(clients).length);
	//console.log(clients);

	// Register user
    socket.on('register', function(username) {
    	clients[socket.id]["name"] = username;
	});

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
			clients[socket.id]["highStreak"] += 1;
			clients[socket.id]["currentQuestionCorrect"] = true;
			if (fastAnswer) {
				clients[socket.id]["score"] += 50;
			}
			var catNumber = currentQuestionID[1];
			switch(catNumber) {
				case "1":
					clients[socket.id].cat1 += 1;
					console.log(clients[socket.id].cat1)
					break;
				case "2":
					clients[socket.id].cat2 += 1;
					break;
				case "3":
					clients[socket.id].cat3 += 1;
					break;
				case "4":
					clients[socket.id].cat4 += 1;
					break;
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
    	var resultTable = rankPlayers(true);
    	io.emit("game-over", resultTable);
    });

    // Get individual badges
    socket.on("get-individual-badges", function() {
    	var badges = clients[socket.id].badges;
    	socket.emit("badges-returned", badges);
    });

});

