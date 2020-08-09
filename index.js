const express = require('express');
const bodyParser = require('body-parser');
var socketIO = require('socket.io')
var http = require('http');
var path = require('path');

//Init the server
const app = express();

var server = http.Server(app);
var io = socketIO(server);

//Customize the server
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', 3000);
app.use(express.static('public'));

//WEBPAGES
app.get('/', (req, res) => {
  res.sendFile('public/index.html');
});

app.get('/play', (req, res) => {
  res.sendFile(__dirname + '/public/playgame/playgame.html');
});

app.get('/screen', (req, res) => {
  res.sendFile(__dirname + '/public/admin/admin.html');
});

app.get('/admin.js', (req, res) => {
  res.sendFile(__dirname + '/public/admin/admin.js');
});

app.get('/playgame.js', (req, res) => {
  res.sendFile(__dirname + '/public/playgame/playgame.js');
});

app.get('/howto', (req, res) => {
  let howto = [
    "<center>",
    " ",
    " ",
    "How to play:",
    " ",
    "Everyone draws 7 cards, and draw a card when it's their turn.",
    "They choose a card to play, and based on what suit it is and the card number, they draw a certain amount of cards.",
    "Everyone goes 2 times, and once that has happened, everyone guesses what was the equasion.",
    "Example: 1st turn. Bob plays the King of Diamonds. The king is represented as 13, and Diamonds is represented as 1. He draws 15 cards.<br/>2nd turn. He plays a 5 of Hearts. 5 is represented as 5, and Hearts is represented as 3. He draws 6 cards.<br/>The answer to the problem is d=c-s+3, d being the amount of cards he draws, c being the card number, and s being the suit.",
    "</center>"
  ];
  let howtostr = howto.join("<br/>");
  res.send(howtostr);
});

//SOME VARS
var playing = false;
var players = [];
var deck = [];
var pile = [];

var turn = 0;

let suits = ["Diamonds", "Clubs", "Hearts", "Spades"];
let cardnums = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"]

//signals,
io.on('connection', function(socket) {
  console.log("Someone has connected!")

  //Recieving Data//

  /* DATA: id, -- adds player to game */
  socket.on('joingame', function(data) {
    if (!playing) {
      players.push({
        id: data.id,
        hand: [],
        name: data.name
      });
      console.log(data.name + " has joined. Id: " + data.id);
      updateScreen();
    } else {
      io.sockets.emit('message', {
        message: "Game has already started!",
        to: data.id
      });
    }
  });

  /* DATA: id, card -- player plays card */
  socket.on('playcard', function(data) {
    if (playing && players[turn].id == data.id && turn != -1) {
      let cards = problem.compute(data.card[0].card, data.card[0].suit);
      sendMessageToAllPlayers(players[turn].name + " played " + cardnums[data.card[0].card - 1] + " of " + suits[data.card[0].suit - 1] + ", and drew " + cards + " cards.");
      giveCardToPlayer(cards, turn);
      updatePlayer(turn)
      turn++;
      runTurn();
    }
  });

  /* DATA: id, a -- player guesses card */
  socket.on('answertoproblem', function(data) {
    if (playing && data.a == problem.problem) {
      for (let i = 0; i < players.length; i++) {
        if (players.id == data.id) {
          sendMessageToAllPlayers(players[i].name + " has guessed it correctly!");
          console.log("Player " + data.id + " (" + players[i].name + ") has guessed it.")
          playersguessedit++;
          playersthatguessed++;
          break;
        }
      }
      
    } else if (playing) {
      playersthatguessed++;
      io.sockets.emit('message', {
        message: "Sorry! That wasn't it!",
        to: data.id
      });
      console.log("Player " + data.id + " has not guessed it.")
      if (playersthatguessed == players.length) {
        sendMessageToAllPlayers("Thanks for playing! The answer to the problem was " + problem.problem + ".");
      }
    }
  });

  /* starts the game, when recieved single */
  socket.on('startgame', function(data) {
    if (!playing) {
      startgame();
      console.log("Started game");
    }
  });
  /* stops the game, when recieved single */
  socket.on('stopgame', function(data) {
    if (playing) {
      stopgame();
      console.log("Stopped game");
    }
  });

});
let playersguessedit = 0;
let playersthatguessed = 0;

/* suits:
diamonds: 1
club: 2,
hearts: 3,
spades: 4

ace: 1,
jack: 11,
queen: 12,
king: 13
 */

let cards = [];

//generates all of the different types of cards
function generateCards() {
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 13; i++) {
      cards.push({
        suit: j + 1,
        card: i + 1
      });
    }
  }
  console.log("Cards generated, length is: " + cards.length);
}

generateCards();  

//generate the first 52 cards of the deck
function generateDeck() {
  deck = [];
  for (let i = 0; i < 52; i++) {
    addCardToDeck();
  }
}

//adds a card to the bottom of the deck
function addCardToDeck() {
  let card = Math.floor(Math.random() * 52);
  deck.push(cards[card]);
}

//start the game
function startgame() {
  if (!playing) {
    playing = true;
    generateDeck();
    runStartGame();
  }
}

//stop the game
function stopgame() {
  if (playing) {
    playing = false;
    sendMessageToAllPlayers("Game has been stopped.");
    players = [];
  }
}

var problem = {
  compute: function(card, suit) {},
  problem: ""
};

function runStartGame() {
  chooseProblem();
  for (let i = 0; i < players.length; i++) {
    giveCardToPlayer(7, i);
    updateScreen();
    updatePlayer(i);
    runTurn();
  }
  
}

let round = 0;

var MAX_ROUNDS = 2;

function runTurn() {
  updateScreen();
  if (turn == players.length) {
    round++;
    turn = 0;
  }
  if (round >= MAX_ROUNDS) {
    turn = -1;
    for (let i = 0; i < players.length; i++) {
      io.sockets.emit('solveproblem', {
        to: players[i].id
      });
    }
  } else {
    io.sockets.emit('turn', {
      to: players[turn].id
    });
    sendMessageToAllPlayers("It is now " + players[turn].name + "'s turn.");
    
    giveCardToPlayer(1, turn);
    updatePlayer(turn);
    updateScreen();
  }
  
  
}

function chooseProblem() {
  let rprob = Math.floor(Math.random() * problems.length);
  problem = problems[rprob];
  console.log("Chosen problem: " + problem.problem);
}

//Problem-no spaces,stuff like that
let problems = [
  {
    compute: function(card, suit) {
      return (suit*2)+card;
    },
    problem: "d=s*2+c"
  },
  {
    compute: function(card, suit) {
      return suit+card;
    },
    problem: "d=s+c"
  },
  {
    compute: function(card, suit) {
      return (card*2)+suit-3;
    },
    problem: "d=c*2+s-3"
  },
  {
    compute: function(card, suit) {
      return card-suit+3;
    },
    problem: "d=c-s+3"
  },
  {
    compute: function(card, suit) {
      return (suit*2)+card-3;
    },
    problem: "d=s*2+c-3"
  },
  {
    compute: function(card, suit) {
      return (suit*3)-card+10;
    },
    problem: "d=s*3-c+10"
  },
  {
    compute: function(card, suit) {
      return suit+card-2;
    },
    problem: "d=s+c-2"
  }
];

//sends an alert to all players
function sendMessageToAllPlayers(message) {
  for (let i = 0; i < players.length; i++) {
    io.sockets.emit('message', {
      message: message,
      to: players[i].id
    });
  }
}

//deck gives x amount of cards to player
function giveCardToPlayer(x, playerindex) {
  for (let i = 0; i < x; i++) {
    players[playerindex].hand.push(deck[0]);
    deck.shift();
    addCardToDeck();
  }
  
}

//update admin screen
function updateScreen() {
  io.sockets.emit('screenupdate', {
    players: players,
    pile: pile
  });
}

//updates player screen
function updatePlayer(pindex) {
  io.sockets.emit('cardsupdate', {
    to: players[pindex].id,
    playerinfo: players[pindex]
  });
}


//START THE SERVER ON PORT 3000
server.listen(3000, function() {
  console.log('Starting server on port 3000');
});

