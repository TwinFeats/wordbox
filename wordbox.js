var minLen = 4;
var word = "";
var solution = {};
var wordlist = [];
var letters = "";
var rnd = new Srand();
var lastcube = null;
var foundWords = [];
var playing = false;
var gameover = false;
var seed = 0;
var total = 0;
var time = 300000;
var lasttime = 0;
var options = {
	size: 5,
	random: true
}
var goodPlay;
var badPlay;
var isMobile = navigator.maxTouchPoints > 1;

function updateGame() {
	var game = '/wordbox/?game=' + options.size + "" + seed;
	history.replaceState(null, 'Wordbox Redux', game);
	navigator.clipboard.writeText("https://kidjuice.com"+game);
}

function init(gameseed) {
	if (isMobile) {
		document.getElementById("pause").firstElementChild.innerHTML = "Two-finger tap to unpause";
	} else {
		document.getElementById("pause").firstElementChild.innerHTML = "Click to unpause";
	}
	goodPlay = document.getElementById("goodPlay");
	badPlay = document.getElementById("badPlay");
	lasttime = 0;
	gameover = false;
	word = "";
	solution = {};
	wordlist = [];
	letters = "";
	lastcube = null;
	foundWords = [];
	playing = false;
	total = 0;
	time = 300000;
	document.getElementById("newgame").disabled = false;
	document.querySelector("#timer").innerHTML = convertTime();
	document.querySelector("#words").innerHTML = "";
	var totalhtml = document.getElementById("total");
	totalhtml.innerHTML = total;
	if (!gameseed) {
		var loc = window.location.search;
		var idx = loc.lastIndexOf("game=");
		if (idx >= 0) {
			gameseed = parseInt(loc.substring(idx + 6));
			options.size = parseInt(loc.substring(idx + 5, idx + 6));
		} else {
			updateBoardSize(5);
		}
	}

	if (options.size == 6) {
		time = 360000;
		minLen = 5;
		document.getElementById("board5").classList.remove("selected");
		document.getElementById("board6").classList.add("selected");
	} else {
		minLen = 4;
		document.getElementById("board5").classList.add("selected");
		document.getElementById("board6").classList.remove("selected");
	}
	if (gameseed) {
		seed = gameseed;
		rnd = new Srand(seed);
		updateGame();
		var b = document.getElementById("board");
		var html = "";
		for (var i = 0; i < options.size * options.size; i++) {
			html += '<div><span></span></div>';
		}
		b.innerHTML = html;
		b.className = "";
		if (options.size == 6) {
			b.className = "board6";
		}
		var cubes = document.querySelectorAll("#board > *");
		for (var i = 0; i < cubes.length; i++) {
			var r = Math.floor(i / options.size);
			var c = i % options.size;
			var cube = cubes[i];
			cube.dataset.row = r;
			cube.dataset.col = c;
		}
		genPuzzle();
		solve();
		wordlist = Object.keys(solution);
		wordlist.sort((w1, w2) => w2.length - w1.length);
		document.getElementById("gamenumber").innerHTML = seed;
		document.getElementById("pausebutton").innerHTML = "Pause";
		pause();
	}
}

function updateBoardStraight() {
	options.random = !options.random;
	document.getElementById("straight").innerHTML = options.random ? "Straight" : "Random";
	var cubeelements = document.querySelectorAll("#board > * > span");
	var i = 0;
	for (var i = 0; i < cubeelements.length; i++) {
		if (options.random) {
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
	options.size = size;
	if (options.size == 6) {
		document.getElementById("board5").classList.remove("selected");
		document.getElementById("board6").classList.add("selected");
	} else {
		document.getElementById("board5").classList.add("selected");
		document.getElementById("board6").classList.remove("selected");
	}
}

function unpause(event) {
	if (!isMobile || !event.isPrimary) {
		var pause = document.querySelector("#pause");
		pause.classList.add("hidden");
		playing = true;
		lasttime = new Date().getTime();
		startTimer();
	}
	event.preventDefault();
}

function pause() {
	if (!gameover) {
		playing = false;
		var pause = document.querySelector("#pause");
		pause.classList.remove("hidden");
	} else {
		document.getElementById("endgame").classList.add("visible");
	}
}

function doNewGame() {
	closeConfirm();
	playing = false;
	newgame();
}

function closeConfirm() {
	document.getElementById('confirm').classList.remove('show');
}

function newgame() {
	if (playing) {
		pause();
		document.getElementById('confirm').classList.add('show');
		return;
	}
	gameover = false;
	playing = false;
	pause();
	rnd = new Srand();
	seed = Math.floor(rnd.inRange(0, 1000000000));
	init(seed);
}

function startdrag(event) {
	event.preventDefault();
	event.target.releasePointerCapture(event.pointerId);
	if (!playing) return;
	var cube = findCube(event.pageX, event.pageY);
	if (cube && !cube.classList.contains("hilite")) {
		lastcube = cube;
		cube.classList.add("hilite");
		word = cube.children[0].textContent.toUpperCase();
		updateWord();
	}
}

function dragging(event) {
	event.preventDefault();
	event.target.releasePointerCapture(event.pointerId);
	if (!playing) return;
	if (!lastcube) return;
	var cube = findCube(event.pageX, event.pageY);
	if (!cube) return;
	if (cube.dataset.row == lastcube.dataset.row && cube.dataset.col == lastcube.dataset.col) return;
	if (isAdjacent(cube) && !cube.classList.contains("hilite")) {
		cube.classList.add("hilite");
		word += cube.children[0].textContent.toUpperCase();
		updateWord();
		lastcube = cube;
	}
}

function isAdjacent(cube) {
	return (Math.abs(parseInt(lastcube.dataset.row) - parseInt(cube.dataset.row)) <= 1 && Math.abs(parseInt(lastcube.dataset.col) - parseInt(cube.dataset.col)) <= 1);
}

function stopdrag(event) {
	event.preventDefault();
	if (!playing) return;
	var cubes = document.querySelectorAll(".hilite");
	for (var i = 0; i < cubes.length; i++) {
		cubes[i].classList.remove('hilite');
	}
	if (word.length >= minLen) {
		if (!foundWords.includes(word)) {
			if (words.includes(word.toLowerCase())) {
				goodPlay.play();
				foundWords.push(word);
				var score = scoreWord();
				total += score;
				var wordshtml = document.getElementById("words");
				wordshtml.innerHTML = wordshtml.innerHTML + "<div><span>" + word + "</span><span>" + score + "</span></div>";
				var totalhtml = document.getElementById("total");
				totalhtml.innerHTML = total;
			} else {
				badPlay.play();
				var w = document.querySelector("#word");
				w.innerHTML = word + " 0";
			}
		} else {
			badPlay.play();
			var w = document.querySelector("#word");
			w.innerHTML = word + " dup";
		}
	} else {
		badPlay.play();
		var w = document.querySelector("#word");
		w.innerHTML = word + " 0";
	}
	lastcube = null;
}

function canceldrag(event) {
	event.preventDefault();
	var cubes = document.querySelectorAll(".hilite");
	for (var i = 0; i < cubes.length; i++) {
		cubes[i].classList.remove('hilite');
	}
	word = "";
	updateWord();
	lastcube = null;
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

function scoreWord() {
	var score = Math.pow(2, word.length - 4);
	var w = document.querySelector("#word");
	w.innerHTML = word + " " + score;
	return score;
}

function updateWord() {
	var w = document.querySelector("#word");
	w.innerHTML = word;
}

function genPuzzle() {
	var cubes5 = ["AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM", "AEEGMU", "AEGMNN", "AFIRSY", "BJKQXZ", "CCENST", "DDHNOT", "CEIILT", "CEILPT", "CEIPST", "DHHLOR", "DHLNOR", "EIIITT", "EMOTTT", "ENSSSU", "FIPRSY", "GORRVW", "IPRRRY", "NOOTUW", "OOOTTU", "DHLNOR"];
	var cubes6 = ["CEIPST", "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM", "AEEGMU", "AEGMNN", "AFIRSY", "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM", "AEEGMU", "AEGMNN", "AFIRSY", "BJKQXZ", "CCENST", "DDHNOT", "CEIILT", "CEILPT", "CEIPST", "DHHLOR", "DHLNOR", "EIIITT", "EMOTTT", "ENSSSU", "FIPRSY", "GORRVW", "IPRRRY", "NOOTUW", "OOOTTU", "DHLNOR", "OOOTTU", "DHLNOR"];
	var cubes = null;

	if (options.size == 6) {
		cubes = cubes6;
	} else {
		cubes = cubes5;
	}
	letters = "";
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
		letters += theletter;
		cubeelements[i].classList.add(theletter);
		if (theletter == 'Q') theletter += "u"
		cubeelements[i].innerHTML = theletter;
		cubeelements[i].classList.add("orientation" + Math.floor(rnd.inRange(0, 4)));
		i++;
	}
}

function solve() {
	solution = {};
	var n = Math.round(Math.sqrt(letters.length));
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
			cubes[r][c] = new Cube(letters.charAt(i++), r, c);
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
		if (w.length >= minLen && !solution[w]) {
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
			solution[word] = word;
			return true;
		}
		if (letter == 'Q') {
			letter = word.charAt(idx);
			if (letter == 'U') {
				idx++;
				if (idx == word.length) {
					solution[word] = word;
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
	playing = false;
	gameover = true;
	var list = document.getElementById("endgame");
	var text = "";
	for (i = 0; i < wordlist.length; i++) {
		if (foundWords.includes(wordlist[i])) {
			text += "<div class='found'>";
		} else {
			text += "<div>";
		}
		text += wordlist[i] + " " + Math.pow(2, wordlist[i].length - 4) + "</div>";
	}
	list.innerHTML = text;
	document.getElementById("endgame").classList.add("visible");
	document.getElementById("pausebutton").innerHTML = "Words";
}

function startTimer() {
	if (!playing) return;
	var now = new Date().getTime();
	var diff = now - lasttime;
	lasttime = now;
	time -= diff;
	if (time < 0) {
		gameOver();
		return;
	}

	document.getElementById('timer').innerHTML = convertTime();
	setTimeout(startTimer, 100);
}

function convertTime() {
	var secs = Math.floor(time / 1000);
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
