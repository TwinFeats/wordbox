var gameState = {
	minLen: 4,
	word: "",
	solution: {},
	wordlist: [],
	letters: "",
	orientations: [],
	lastcube: null,
	foundWords: [],
	playing: false,
	gameover: false,
	seed: 0,
	total: 0,
	time: 300000,
	options: {
		size: 5,
		random: true
	},
};

var isMobile = navigator.maxTouchPoints > 1;
var rnd = new Srand();
var goodPlay;
var badPlay;
var lasttime = 0;
var timerCount = 0;

function updateGame() {
	var game = '/wordbox/?game=' + gameState.options.size + "" + gameState.seed;
	if (isMobile) {
		history.replaceState(null, 'Wordbox Redux', game);
	}
	navigator.clipboard.writeText("https://kidjuice.com"+game);
}

function restoreGame(savedGame) {
	gameState = JSON.parse(savedGame);
	gameState.playing = false;
	pause();

	initBoard();

	//reinit appropriately here
	document.getElementById("newgame").disabled = false;
	document.querySelector("#timer").innerHTML = convertTime();
	document.querySelector("#words").innerHTML = "";
	var totalhtml = document.getElementById("total");
	totalhtml.innerHTML = gameState.total;

	var cubeelements = document.querySelectorAll("#board > * > span");
	for (var i = 0; i < gameState.letters.length; i++) {
		var theletter = gameState.letters.charAt(i);
		cubeelements[i].classList.add(theletter);
		if (theletter == 'Q') theletter += "u"
		cubeelements[i].innerHTML = theletter;
		cubeelements[i].classList.add("orientation" + gameState.orientations[i]);
	}
	updateBoardSize(gameState.options.size);
	for (var i=0; i<gameState.foundWords.length;i++) {
		addWord(gameState.foundWords[i], scoreWord(gameState.foundWords[i]));
	}
}

function init(gameseed) {
	goodPlay = document.getElementById("goodPlay");
	badPlay = document.getElementById("badPlay");
	lasttime = 0;
	var savedGame = localStorage.getItem("savedGame");
	if (savedGame && (savedGame.time > 0 || savedGame.seed == gameseed)) {
		restoreGame(savedGame);
		return;
	}
	try {
	gameState.gameover = false;
	gameState.word = "";
	gameState.solution = {};
	gameState.wordlist = [];
	gameState.letters = "";
	gameState.lastcube = null;
	gameState.foundWords = [];
	gameState.playing = false;
	gameState.total = 0;
	gameState.time = 300000;
	gameState.letters = "";
	document.getElementById("newgame").disabled = false;
	document.querySelector("#timer").innerHTML = convertTime();
	document.querySelector("#words").innerHTML = "";
	var totalhtml = document.getElementById("total");
	totalhtml.innerHTML = gameState.total;
	if (!gameseed) {
		var loc = window.location.search;
		var idx = loc.lastIndexOf("game=");
		if (idx >= 0) {
			gameseed = parseInt(loc.substring(idx + 6));
			gameState.options.size = parseInt(loc.substring(idx + 5, idx + 6));
		} else {
			updateBoardSize(5);
		}
	}

	if (gameState.options.size == 6) {
		gameState.time = 360000;
		gameState.minLen = 5;
		document.getElementById("board5").classList.remove("selected");
		document.getElementById("board6").classList.add("selected");
	} else {
		gameState.minLen = 4;
		document.getElementById("board5").classList.add("selected");
		document.getElementById("board6").classList.remove("selected");
	}
	if (gameseed) {
		gameState.seed = gameseed;
		rnd = new Srand(gameState.seed);
		updateGame();
		initBoard();
		genPuzzle();
		solve();
		gameState.wordlist = Object.keys(gameState.solution);
		gameState.wordlist.sort((w1, w2) => w2.length - w1.length);
		document.getElementById("gamenumber").innerHTML = gameState.seed;
		document.getElementById("pausebutton").innerHTML = "Pause";
		pause();
	}
	} catch (e) {
		console.log(e);
			alert(e);
		}
}

function initBoard() {
	var b = document.getElementById("board");
	var html = "";
	for (var i = 0; i < gameState.options.size * gameState.options.size; i++) {
		html += '<div><span></span></div>';
	}
	b.innerHTML = html;
	b.className = "";
	if (gameState.options.size == 6) {
		b.className = "board6";
	}
	var cubes = document.querySelectorAll("#board > *");
	for (var i = 0; i < cubes.length; i++) {
		var r = Math.floor(i / gameState.options.size);
		var c = i % gameState.options.size;
		var cube = cubes[i];
		cube.dataset.row = r;
		cube.dataset.col = c;
	}
}

function updateBoardStraight() {
	gameState.options.random = !gameState.options.random;
	document.getElementById("straight").innerHTML = gameState.options.random ? "Straight" : "Random";
	var cubeelements = document.querySelectorAll("#board > * > span");
	var i = 0;
	for (var i = 0; i < cubeelements.length; i++) {
		if (gameState.options.random) {
			cubeelements[i].classList.remove("orientation0");
		} else {
			cubeelements[i].classList.add("orientation0");
		}
	}
}

function hide(event) {
	if (!isMobile || !event.isPrimary) {
		document.getElementById("endgame").classList.remove("visible");
	}
}

function updateBoardSize(size) {
	gameState.options.size = size;
	if (gameState.options.size == 6) {
		document.getElementById("board5").classList.remove("selected");
		document.getElementById("board6").classList.add("selected");
	} else {
		document.getElementById("board5").classList.add("selected");
		document.getElementById("board6").classList.remove("selected");
	}
}

function unpause(event) {
	// document.documentElement.requestFullscreen().then(() => {
    //     screen.orientation.lock('portrait');
	// if (!isMobile || !event.isPrimary) {
		playBad();
		badPlay.pause();
		playGood();
		goodPlay.pause();
		var pause = document.querySelector("#pause");
		pause.classList.add("hidden");
		gameState.playing = true;
		lasttime = new Date().getTime();
		timerCount = 0;
		startTimer();
	// }
	// event.preventDefault();
}

function pause() {
	if (!gameState.gameover) {
		gameState.playing = false;
		var pause = document.querySelector("#pause");
		pause.classList.remove("hidden");
	} else {
		document.getElementById("endgame").classList.add("visible");
	}
}

function doNewGame() {
	closeConfirm();
	gameState.playing = false;
	newgame();
}

function closeConfirm() {
	document.getElementById('confirm').classList.remove('show');
}

function newgame() {
	if (gameState.playing) {
		gameState.playing = false;
		document.getElementById('confirm').classList.add('show');
		return;
	}
	localStorage.clear();
	gameState.gameover = false;
	gameState.playing = false;
	pause();
	rnd = new Srand();
	gameState.seed = rnd.seed();
	init(gameState.seed);
}

function startdrag(event) {
	event.preventDefault();
	event.target.releasePointerCapture(event.pointerId);
	if (!gameState.playing) return;
	var cube = findCube(event.pageX, event.pageY);
	if (cube && !cube.classList.contains("hilite")) {
		gameState.lastcube = cube;
		cube.classList.add("hilite");
		gameState.word = cube.children[0].textContent.toUpperCase();
		updateWord();
	}
}

function dragging(event) {
	event.preventDefault();
	event.target.releasePointerCapture(event.pointerId);
	if (!gameState.playing) return;
	if (!gameState.lastcube) return;
	var cube = findCube(event.pageX, event.pageY);
	if (!cube) return;
	if (cube.dataset.row == gameState.lastcube.dataset.row && cube.dataset.col == gameState.lastcube.dataset.col) return;
	if (isAdjacent(cube) && !cube.classList.contains("hilite")) {
		cube.classList.add("hilite");
		gameState.word += cube.children[0].textContent.toUpperCase();
		updateWord();
		gameState.lastcube = cube;
	}
}

function isAdjacent(cube) {
	return (Math.abs(parseInt(gameState.lastcube.dataset.row) - parseInt(cube.dataset.row)) <= 1 && Math.abs(parseInt(gameState.lastcube.dataset.col) - parseInt(cube.dataset.col)) <= 1);
}

function addWord(word, score) {
	var wordshtml = document.getElementById("words");
	wordshtml.innerHTML = wordshtml.innerHTML + "<div><span>" + word + "</span><span>" + score + "</span></div>";

}

function stopdrag(event) {
	event.preventDefault();
	if (!gameState.playing) return;
	var cubes = document.querySelectorAll(".hilite");
	for (var i = 0; i < cubes.length; i++) {
		cubes[i].classList.remove('hilite');
	}
	if (gameState.word.length >= gameState.minLen) {
		if (!gameState.foundWords.includes(gameState.word)) {
			if (words.includes(gameState.word.toLowerCase())) {
				playGood();
				blink(4, "goodword");
				gameState.foundWords.push(gameState.word);
				var score = scoreWord(gameState.word);
				gameState.total += score;
				addWord(gameState.word, score);
				var totalhtml = document.getElementById("total");
				totalhtml.innerHTML = gameState.total;
				localStorage.setItem("savedGame", JSON.stringify(gameState));
			} else {
				playBad();
				blink(4, "badword");
				var w = document.querySelector("#word");
				w.innerHTML = gameState.word + " 0";
			}
		} else {
			playBadDup();
			blink(4, "dupword");
			var w = document.querySelector("#word");
			w.innerHTML = gameState.word + " dup";
		}
	} else {
		playBad();
		blink(4, "badword");
		var w = document.querySelector("#word");
		w.innerHTML = gameState.word + " 0";
	}
	gameState.lastcube = null;
}

function blink(count, cssClass) {
    document.getElementById("board").classList.toggle(cssClass);
    setTimeout(function() {
        if (--count > 0) {
            blink(count, cssClass);
        }
    }, 125);
}

function playGood() {
	goodPlay.play();
}

function playBad() {
	badPlay.play();
}

function playBadDup() {
	badPlay.play();
}

function canceldrag(event) {
	event.preventDefault();
	var cubes = document.querySelectorAll(".hilite");
	for (var i = 0; i < cubes.length; i++) {
		cubes[i].classList.remove('hilite');
	}
	gameState.word = "";
	updateWord();
	gameState.lastcube = null;
}

function findCube(x, y) {
	var cubes = document.querySelectorAll("#board > *");
	for (var i = 0; i < cubes.length; i++) {
		var cube = cubes[i];
		var w = cube.clientWidth / 6;
		var h = cube.clientHeight / 6;
		if (x >= cube.offsetLeft + w && x < cube.offsetLeft + cube.clientWidth - w) {
			if (y >= cube.offsetTop + h && y < cube.offsetTop + cube.clientHeight - h) {
				return cube;
			}
		}
	}
	return null;
}

function scoreWord(word) {
	var score = Math.pow(2, word.length - 4);
	var w = document.querySelector("#word");
	w.innerHTML = word + " " + score;
	return score;
}

function updateWord() {
	var w = document.querySelector("#word");
	w.innerHTML = gameState.word;
}

function genPuzzle() {
	var cubes5 = ["AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM", "AEEGMU", "AEGMNN", "AFIRSY", "BJKQXZ", "CCENST", "DDHNOT", "CEIILT", "CEILPT", "CEIPST", "DHHLOR", "DHLNOR", "EIIITT", "EMOTTT", "ENSSSU", "FIPRSY", "GORRVW", "IPRRRY", "NOOTUW", "OOOTTU", "DHLNOR"];
	var cubes6 = ["CEIPST", "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM", "AEEGMU", "AEGMNN", "AFIRSY", "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM", "AEEGMU", "AEGMNN", "AFIRSY", "BJKQXZ", "CCENST", "DDHNOT", "CEIILT", "CEILPT", "CEIPST", "DHHLOR", "DHLNOR", "EIIITT", "EMOTTT", "ENSSSU", "FIPRSY", "GORRVW", "IPRRRY", "NOOTUW", "OOOTTU", "DHLNOR", "OOOTTU", "DHLNOR"];
	var cubes = null;

	if (gameState.options.size == 6) {
		cubes = cubes6;
	} else {
		cubes = cubes5;
	}
	var cubeelements = document.querySelectorAll("#board > * > span");
	var i = 0;
	while (cubes.length > 0) {
		var cube, letter;
		var theletter;
		cube = Math.floor(rnd.inRange(0, cubes.length));
		var cletters = cubes[cube];
		cubes.splice(cube, 1);
		var letter = Math.floor(rnd.inRange(0, cletters.length));
		var theletter = cletters.charAt(letter);
		gameState.letters += theletter;
		cubeelements[i].classList.add(theletter);
		if (theletter == 'Q') theletter += "u"
		cubeelements[i].innerHTML = theletter;
		var o = Math.floor(rnd.inRange(0, 4));
		gameState.orientations.push(o);
		cubeelements[i].classList.add("orientation" + o);
		i++;
	}
}

function solve() {
	gameState.solution = {};
	var n = Math.round(Math.sqrt(gameState.letters.length));
	var cubes = new Array(n);
	for (var i = 0; i < n; i++) {
		cubes[i] = new Array(n);
	}
	var map = {};
	var i = 0;
	var ch;
	var cubelist = [];
	for (var r = 0; r < n; r++) {
		for (var c = 0; c < n; c++) {
			cubes[r][c] = new Cube(gameState.letters.charAt(i++), r, c);
			var ch = cubes[r][c].letter;
			cubelist = map[ch];
			if (!cubelist) {
				cubelist = [];
				map[ch] = cubelist;
			}
			cubelist.push(cubes[r][c]);
		}
	}
	ch = null;
	for (var n = 0; n < words.length; n++) {
		var w = words[n].toUpperCase();
		if (w.length >= gameState.minLen && !gameState.solution[w]) {
			var cr = w.charAt(0);
			if (ch == null || ch != cr) {
				ch = cr;
			}
			cubelist = map[ch];
			if (cubelist) {
				for (var ci = 0; ci < cubelist.length; ci++) {
					var cube = cubelist[ci];
					processCube(cubes, cube.row, cube.col, w, 0);
					for (var r = 0; r < cubes.length; r++)
						for (var c = 0; c < cubes.length; c++)
							cubes[r][c].tried = false;
				}

			}
		}
	};
}

function processCube(cubes, r, c, word, idx) {
	var letter = word.charAt(idx);
	if (!cubes[r][c].tried && cubes[r][c].letter == letter) {
		cubes[r][c].tried = true;
		idx++;
		if (idx == word.length) {
			gameState.solution[word] = word;
			return true;
		}
		if (letter == 'Q') {
			letter = word.charAt(idx);
			if (letter == 'U') {
				idx++;
				if (idx == word.length) {
					gameState.solution[word] = word;
					return true;
				}
			}
			else {
				cubes[r][c].tried = false;
				return false;
			}
		}
		for (var r2 = r - 1; r2 <= r + 1; r2++) {
			for (var c2 = c - 1; c2 <= c + 1; c2++) {
				if (r2 >= 0 && c2 >= 0 && r2 < cubes.length && c2 < cubes.length) {
					if (!cubes[r2][c2].tried) {
						if (processCube(cubes, r2, c2, word, idx)) {
							cubes[r2][c2].tried = false;
							return true;
						}
						else
							cubes[r2][c2].tried = false;
					}
				}
			}
		}
		cubes[r][c].tried = false;
	}
	return false;
}

function gameOver() {
	gameState.playing = false;
	gameState.gameover = true;
	var list = document.getElementById("endgame");
	var text = "";
	for (i = 0; i < gameState.wordlist.length; i++) {
		if (gameState.foundWords.includes(gameState.wordlist[i])) {
			text += "<div class='found'>";
		} else {
			text += "<div>";
		}
		text += gameState.wordlist[i] + " " + Math.pow(2, gameState.wordlist[i].length - 4) + "</div>";
	}
	list.innerHTML = text;
	document.getElementById("endgame").classList.add("visible");
	document.getElementById("pausebutton").innerHTML = "Words";
	localStorage.setItem("savedGame", JSON.stringify(gameState));
}

function startTimer() {
	if (!gameState.playing) return;
	var now = new Date().getTime();
	var diff = now - lasttime;
	lasttime = now;
	gameState.time -= diff;
	if (++timerCount >= 10) {
		localStorage.setItem("savedGame", JSON.stringify(gameState));
		timerCount = 0;
	}
	if (gameState.time < 0) {
		gameState.time = 0;
		gameOver();
		return;
	}

	document.getElementById('timer').innerHTML = convertTime();
	setTimeout(startTimer, 100);
}

function convertTime() {
	var secs = Math.floor(gameState.time / 1000);
	var m = "" + Math.floor(secs / 60);
	var s = secs % 60;
	if (s < 10) {
		s = "0" + s;
	}
	return m + ":" + s
}


function checkSecond(sec) {
	if (sec < 0) { sec = 59 };
	return sec;
}

function zeroPadLeft(sec) {
	if (sec < 10 && sec >= 0) {
		sec = "0" + sec; // add zero in front of numbers < 10
	}
	return "" + sec;
}

class Cube {
	constructor(l, row, col) {
		this.letter = l;
		this.row = row;
		this.col = col;
		this.tried = false;
	}
}
