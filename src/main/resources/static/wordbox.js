var word = "";
var solution = {};
var letters = "";
var rnd = new Srand();
var lastcube = null;
var foundWords = [];
var playing = false;
var seed = 0;
var total = 0;

function init() {
	word = "";
	solution = {};
	letters = "";
	rnd = new Srand();
	lastcube = null;
	foundWords = [];
	playing = false;
	seed = 0;
	total = 0;
	document.querySelector("#timer").innerHTML = "5:00";
	document.querySelector("#words").innerHTML = "";
	var totalhtml = document.getElementById("total");
	totalhtml.innerHTML = total;
	var loc = window.location.href;
	var idx = loc.lastIndexOf("game=");
	if (idx > 0) {
		seed = parseInt(loc.substring(idx+5));
	} else {
		seed = Math.floor(rnd.inRange(0, 10000000));
	}
	rnd = new Srand(seed);
	if (idx < 0) {
		history.replaceState(null, 'Wordbox Redux', 'http://twinfeats.com/wordbox?game='+seed);
	}
	var cubes = document.querySelectorAll("#board > *");
	for (var i = 0; i < cubes.length; i++) {
		var r = Math.floor(i / 5);
		var c = i % 5;
		var cube = cubes[i];
		cube.dataset.row = r;
		cube.dataset.col = c;
	}
	genPuzzle();
	solve();
}

function unpause(event) {
	if (event.touches.length == 1) {
		var pause = document.querySelector("#pause");
		pause.classList.add("hidden");
		playing = true;
		startTimer();
	}
	event.preventDefault();
}

function pause() {
	playing = false;
	var pause = document.querySelector("#pause");
	pause.classList.remove("hidden");
}

function newgame() {
	pause();
	history.replaceState(null, 'Wordbox Redux', 'http://twinfeats.com/wordbox');
	init();
}

function startdrag(event) {
	event.preventDefault();
	if (!playing) return;
	var cube = findCube(event.touches[0].clientX, event.touches[0].clientY);
	if (cube && !cube.classList.contains("hilite")) {
		lastcube = cube;
		cube.classList.add("hilite");
		word = cube.children[0].textContent;
		updateWord();
	}
}

function dragging(event) {
	event.preventDefault();
	if (!playing) return;
	if (!lastcube) return;
	var cube = findCube(event.touches[0].clientX, event.touches[0].clientY);
	if (!cube) return;
	if (cube.dataset.row == lastcube.dataset.row && cube.dataset.col == lastcube.dataset.col) return;
	if (isAdjacent(cube) && !cube.classList.contains("hilite")) {
		cube.classList.add("hilite");
		word += cube.children[0].textContent;
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
	if (word.length >= 3) {
		if (!foundWords.includes(word)) {
			if (words.includes(word.toLowerCase())) {
				foundWords.push(word);
				var score = scoreWord();
				total += score;
				var wordshtml = document.getElementById("words");
				wordshtml.innerHTML = wordshtml.innerHTML + "<div><span>" + word + "</span><span>" + score + "</span></div>";
				var totalhtml = document.getElementById("total");
				totalhtml.innerHTML = total;
			} else {
				var w = document.querySelector("#word");
				w.innerHTML = word + " 0";
			}
		} else {
			var w = document.querySelector("#word");
			w.innerHTML = word + " dup";
		}
	} else {
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
		var w = cube.clientWidth / 5;
		var h = cube.clientHeight / 5;
		if (x >= cube.offsetLeft + w && x < cube.offsetLeft + cube.clientWidth - w) {
			if (y >= cube.offsetTop + h && y < cube.offsetTop + cube.clientHeight - h) {
				return cube;
			}
		}
	}
	return null;
}

function scoreWord() {
	var score = Math.pow(2, word.length - 3);
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
	letters = "";
	var cubeelements = document.querySelectorAll("#board > * > span");
	var i = 0;
	while (cubes5.length > 0) {
		var cube, letter;
		var theletter;
		cube = Math.floor(rnd.inRange(0, cubes5.length));
		var cletters = cubes5[cube];
		cubes5.splice(cube, 1);
		var letter = Math.floor(rnd.inRange(0, cletters.length));
		var theletter = cletters.charAt(letter);
		letters += theletter;
		for (let v of cubeelements[i].classList.values()) {
			cubeelements[i].classList.remove(v);
		}
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
		if (w.length >= 3 && !solution[w]) {
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

function findWord(cubes, word) {
	for (var r = 0; r < cubes.length; r++) {
		for (var c = 0; c < cubes.length; c++) {
			processCube(cubes, r, c, word, 0);
			cubes[r][c].tried = false;
		}
	}
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
		if (letter == 'q') {
			letter = word.charAt(idx);
			if (letter == 'u') {
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
}

function startTimer() {
	if (!playing) return;
	var presentTime = document.getElementById('timer').innerHTML;
	var timeArray = presentTime.split(/[:]+/);
	var m = timeArray[0];
	var s = checkSecond((timeArray[1] - 1));
	if (s == 59) { m = m - 1 }
	if (m < 0) {
		gameOver();
		return;
	}

	document.getElementById('timer').innerHTML =
		m + ":" + s;
	setTimeout(startTimer, 1000);

}

function checkSecond(sec) {
	if (sec < 10 && sec >= 0) { sec = "0" + sec }; // add zero in front of numbers < 10
	if (sec < 0) { sec = "59" };
	return sec;
}

class Cube {
	constructor(l, row, col) {
		this.letter = l;
		this.row = row;
		this.col = col;
		this.tried = false;
	}
}