var socket = io();
let players = [];
let playing = false;
let pile = [{
  card: 14,
  suit: 5
}];

function startorstop() {
  
  if (!playing) {
    startplaying();
    playing = true;
  } else {
    stopplaying();
    playing = false;
  }
  alert("Playing: " + playing);
  updateScreen();
}

function startplaying() {
  socket.emit('startgame', { filler: "NaN" });
  document.getElementById("gameprogress").textContent = "Stop Playing";
  
}

function stopplaying() {
  socket.emit('stopgame', { filler: "NaN" });
  document.getElementById("gameprogress").textContent = "Start Playing";
  
}

/*recieve:  players(all players), pile*/
socket.on('screenupdate', function(data) {
  players = data.players;
  pile = data.pile;
  updateScreen();
});

let suits = ["Diamonds", "Clubs", "Hearts", "Spades", "No Suit"];
let cardnums = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "No Card"]

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

function cardToText(c) {
  return cardnums[c.card - 1] + " of " + suits[c.suit - 1];
}

function updateScreen() {
  let addhtml = "";
  for (let i = 0; i < players.length; i++) {
    addhtml += "<div class=\"player\">Name: " + players[i].name + ", Amount of cards: " + players[i].hand.length + "</div>";
  }
  document.getElementById("players").innerHTML = addhtml;
  document.getElementById("deck").textContent = "Last Played Card: " + cardToText(pile[pile.length - 1]);
  document.getElementById("gameinfo").textContent = "Playing: " + playing + ", Amount of players: " + players.length;
}

updateScreen();
