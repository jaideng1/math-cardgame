var socket = io();
var id = Math.floor(Math.random() * (256*256*128));

var mycards = [];
var cancelremovegame = false;
var holderforenterhtml = "";

var myturn = false;

function joingame() {
  socket.emit('joingame', {
    id: id, 
    name: document.getElementById("name").value
  });
  setTimeout(function() {
    if (!cancelremovegame) {
      holderforenterhtml = document.getElementById("login").innerHTML + "";
      document.getElementById("login").innerHTML = "";

    } else {
      cancelremovegame = false;
    }
  }, 750);

}

function playCard(suit, card) {
  if (myturn) {
    myturn = false;
    let cardplayed;
    for (let i = 0; i < mycards.length; i++) {
      if (mycards[i].suit == suit && mycards[i].card == card) {
        cardplayed = mycards.splice(i,1);
        break;
      }
    }
    socket.emit('playcard', {
      id: id,
      card: cardplayed
    })
  } else {
    alert("It's not your turn!")
  }
}

/*recieve: to, card{suit, card} */
socket.on('cardsupdate', function(data) {
  if (data.to == id) {
    mycards = data.playerinfo.hand;
    updateScreenCards();
  }
});

/*recieve: to */
socket.on('turn', function(data) {
  if (data.to == id) {
    alert("Your turn.")
    myturn = true;
  }
});

/*recieve: to */
socket.on('solveproblem', function(data) {
  if (data.to == id) {
    let an = prompt("What do you think the problem is? Use 's' for the suit, and 'c' for the number, and 'd' for how many cards you draw. It starts with 'd='. EXAMPLE: d=s+c+1");
    an = an.replace(/\s+/g, '').toLowerCase();
    socket.emit('answertoproblem', {
      id: id,
      a: an
    })
  }
});

socket.on('message', function(data) {
  if (data.to == id) {
    if (data.message == "Game has already started!") {
      cancelremovegame = true;
    }
    if (data.message == "Game has been stopped.") {
      document.getElementById("login").innerHTML = holderforenterhtml;
    }
    alert(data.message);
  }
});

let suits = ["Diamonds", "Clubs", "Hearts", "Spades"];
let cardnums = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"]

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

function updateScreenCards() {
  let addhtml = "<br/>";
  for (let i = 0; i < mycards.length; i++) {
    let cardname = cardnums[mycards[i].card - 1];
    let suit = suits[mycards[i].suit - 1];
    
    addhtml += "<div class=\"card\">Suit: <b>" + suit + "</b>, Card Number: <b>" + cardname + "</b>&nbsp;&nbsp;&nbsp;<button onclick=\"playCard(" + mycards[i].suit + ", " + mycards[i].card + ")\">Play this card</button></div><br/><br/>";
  }
  addhtml += "<br/>";
  document.getElementById("cards").innerHTML = addhtml;

}
