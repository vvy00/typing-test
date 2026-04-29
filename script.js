/* fact bank */
const allFacts = {
  easy: [
    { cat: "Animals",      text: "A group of flamingos is called a flamboyance, which suits them perfectly." },
    { cat: "Food",         text: "Honey never spoils and can stay edible for thousands of years." },
    { cat: "Animals",      text: "Otters hold hands while sleeping so they do not drift apart." },
    { cat: "History",      text: "Cleopatra lived closer in time to the Moon landing than to the Great Pyramid of Giza." },
    { cat: "Animals",      text: "A snail can sleep for up to three years without waking up." },
    { cat: "Food",         text: "Almonds are a member of the peach family." },
    { cat: "Space",        text: "There are more stars in the universe than grains of sand on Earth." },
    { cat: "Animals",      text: "Penguins propose to mates by offering them a small pebble." },
    { cat: "Animals",      text: "All clown fish are born male and can become female later in life." },
    { cat: "Science",      text: "The Eiffel Tower can be 15cm taller during the summer." },
    { cat: "Animals",      text: "Cows can form close friendships and get stressed when separated." },
  ],
  medium: [
    { cat: "Biology",      text: "Wombats produce cube-shaped poop, making them the only known animal to do so. Scientists spent years figuring out why." },
    { cat: "Physics",      text: "If you removed all the empty space from atoms in the human body, all 8 billion people on Earth would fit in a sugar cube." },
    { cat: "Biology",      text: "Your body has enough carbon for 900 pencils, enough iron for a 3-inch nail, and enough fat for 7 bars of soap." },
    { cat: "Geography",    text: "Oxford University is older than the Aztec Empire. Teaching began there in 1096, while Tenochtitlan was founded in 1325." },
    { cat: "Human body",   text: "Your nose can detect about one trillion different smells, yet somehow wet dog and fresh bread use the same hardware." },
    { cat: "Space",        text: "One day on Venus is longer than one year on Venus. It rotates so slowly it completes an orbit before one full spin." },
    { cat: "Animals",      text: "Mantis shrimp can punch with the force of a bullet and perceive 16 types of color, compared to just 3 in humans." },
    { cat: "Animals",      text: "A blue whale's throat is incredibly narrow, so it cannot swallow anything larger than a beach ball." },
    { cat: "History",      text: "Wealthy Romans used human urine as mouthwash because they believed the ammonia acted as a whitener." },
  ],
  hard: [
    { cat: "Physics",      text: "Hot water can freeze faster than cold water under certain conditions, a phenomenon called the Mpemba effect that physicists still cannot fully explain." },
    { cat: "Linguistics",  text: "The word set has 430 definitions in the Oxford English Dictionary, making it the English word with the most distinct meanings ever recorded." },
    { cat: "Biology",      text: "Tardigrades, also known as water bears, can survive in the vacuum of outer space, endure temperatures from near absolute zero to 150 degrees Celsius, and withstand radiation lethal to virtually all other life." },
    { cat: "Mathematics",  text: "If you shuffled a standard deck of 52 playing cards, the resulting order has almost certainly never existed before in the history of the universe, as there are more possible arrangements than atoms on Earth." },
    { cat: "Neuroscience", text: "The human brain generates roughly 70,000 thoughts per day and consumes 20 percent of the body's energy despite accounting for only 2 percent of its total mass." },
    { cat: "Cosmology",    text: "The observable universe contains around two trillion galaxies, yet 96 percent of it is made of dark matter and dark energy, which we cannot directly detect or fully understand." },
    { cat: "History",      text: "The Byzantine Empire, the eastern continuation of the Roman Empire, outlasted its western counterpart by nearly a thousand years, finally falling to the Ottoman Turks in 1453 AD." },
  ],
};

let currentLevel = 'easy';
let queues = { easy: shuffle(allFacts.easy), medium: shuffle(allFacts.medium), hard: shuffle(allFacts.hard) };
let queueIndexes = { easy: 0, medium: 0, hard: 0 };

let currentFact = queues.easy[0];
let started = false, finished = false, paused = false;
let timerInterval = null, elapsed = 0;
let scores = [];

function shuffle(arr) { return [...arr].sort(function() { return Math.random() - 0.5; }); }

/* level switching */
document.querySelectorAll('.level-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.level-btn').forEach(function(b) {
      b.className = 'level-btn';
    });
    btn.classList.add('active-' + btn.dataset.level);
    currentLevel = btn.dataset.level;
    var idx = queueIndexes[currentLevel];
    loadFact(queues[currentLevel][idx]);
  });
});

/* rendering */
function renderFact(typed) {
  var text = currentFact.text;
  var frags = [];
  for (var i = 0; i < text.length; i++) {
    var ch = text[i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    if (i < typed.length) {
      frags.push('<span class="' + (typed[i] === text[i] ? 'correct' : 'wrong') + '">' + ch + '</span>');
    } else if (i === typed.length) {
      frags.push('<span class="active">' + ch + '</span>');
    } else {
      frags.push('<span class="pending">' + ch + '</span>');
    }
  }
  document.getElementById('fact-display').innerHTML = frags.join('');
  document.getElementById('fact-cat').textContent = currentFact.cat;
  document.getElementById('progress').style.width = Math.min(100, Math.round((typed.length / text.length) * 100)) + '%';
}

function setDiffBadge(level) {
  var badge = document.getElementById('diff-badge');
  badge.textContent = level.charAt(0).toUpperCase() + level.slice(1);
  badge.className = 'diff-badge ' + level;
}

/* stats */
function calcStats(typed) {
  var text = currentFact.text;
  var correct = 0;
  for (var i = 0; i < Math.min(typed.length, text.length); i++) {
    if (typed[i] === text[i]) correct++;
  }
  var acc = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 0;
  var wpm = (elapsed > 0 && typed.length > 0) ? Math.round((typed.length / 5) / (elapsed / 60)) : 0;
  return { wpm: wpm, acc: acc };
}

function updateStats(typed) {
  var s = calcStats(typed);
  document.getElementById('wpm-val').innerHTML = (started && elapsed > 0 ? s.wpm : '—') + '<span class="stat-unit">wpm</span>';
  document.getElementById('acc-val').innerHTML = (typed.length > 0 ? s.acc : '—') + '<span class="stat-unit">%</span>';
}

/* timer */
function startTimer() {
  var startTime = Date.now() - (elapsed * 1000);
  timerInterval = setInterval(function() {
    elapsed = (Date.now() - startTime) / 1000;
    document.getElementById('time-val').innerHTML = elapsed.toFixed(1) + '<span class="stat-unit">s</span>';
    updateStats(document.getElementById('typing-input').value);
  }, 100);
}

function stopTimer() { clearInterval(timerInterval); timerInterval = null; }

/* pause */
function setPaused(val) {
  paused = val;
  var btn = document.getElementById('pause-btn');
  var cover = document.getElementById('pause-cover');
  var input = document.getElementById('typing-input');
  var timeStat = document.getElementById('time-stat');

  if (paused) {
    stopTimer();
    btn.textContent = 'Resume';
    btn.classList.add('is-paused');
    cover.classList.add('visible');
    timeStat.classList.add('paused');
    input.disabled = true;
  } else {
    startTimer();
    btn.textContent = 'Pause';
    btn.classList.remove('is-paused');
    cover.classList.remove('visible');
    timeStat.classList.remove('paused');
    input.disabled = false;
    input.focus();
  }
}

document.getElementById('pause-btn').addEventListener('click', function() {
  if (!started || finished) return;
  setPaused(!paused);
});

/* finish */
function showResult(typed) {
  var s = calcStats(typed);
  scores.push({ wpm: s.wpm, acc: s.acc, fact: currentFact.text, level: currentLevel });
  scores.sort(function(a, b) { return b.wpm - a.wpm; });
  renderLeaderboard();

  var reactions = [
    [120, "Are your fingers even real?",  s.wpm + " wpm - you may be part robot or may be a full bot. Deeply suspicious."],
    [90,  "Absolutely blazing.",           s.wpm + " wpm, " + s.acc + "% accuracy. Your keyboard is very scared & frightened by you."],
    [60,  "Solid typing!",                 s.wpm + " wpm - comfortably above average. The fact has been typed :)."],
    [40,  "Decent effort!",                s.wpm + " wpm - you typed it, and that's what matters :-/."],
    [0,   "Nice and steady!",              s.wpm + " wpm - the important thing is you learned something. Yay!"],
  ];
  var match = reactions.find(function(r) { return s.wpm >= r[0]; });
  document.getElementById('result-title').textContent = match[1];
  document.getElementById('result-desc').textContent = match[2];
  document.getElementById('result-banner').classList.add('show');
  document.getElementById('hint-label').textContent = 'Press Next for a new fact';
}

function renderLeaderboard() {
  var body = document.getElementById('lb-body');
  if (scores.length === 0) {
    body.innerHTML = '<div class="lb-empty">No runs yet - finish a fact to see your scores!</div>';
    return;
  }
  body.innerHTML = scores.slice(0, 5).map(function(s, i) {
    return '<div class="lb-row">'
      + '<span class="lb-rank">' + (i+1) + '</span>'
      + '<span class="lb-wpm">' + s.wpm + '<span style="font-size:11px;color:var(--text3);margin-left:3px">wpm</span></span>'
      + '<span class="lb-acc">' + s.acc + '%</span>'
      + '<span class="lb-diff ' + s.level + '">' + s.level + '</span>'
      + '<span class="lb-fact">' + s.fact + '</span>'
      + '</div>';
  }).join('');
}

/* load fact */
function loadFact(fact) {
  currentFact = fact;
  started = false; finished = false; paused = false; elapsed = 0;
  stopTimer();

  var input = document.getElementById('typing-input');
  var btn = document.getElementById('pause-btn');
  var cover = document.getElementById('pause-cover');
  var timeStat = document.getElementById('time-stat');

  input.value = '';
  input.disabled = false;
  btn.textContent = 'Pause';
  btn.classList.remove('is-paused');
  btn.disabled = true;
  cover.classList.remove('visible');
  timeStat.classList.remove('paused');

  document.getElementById('result-banner').classList.remove('show');
  document.getElementById('time-val').innerHTML = '0<span class="stat-unit">s</span>';
  document.getElementById('wpm-val').innerHTML = '—<span class="stat-unit">wpm</span>';
  document.getElementById('acc-val').innerHTML = '—<span class="stat-unit">%</span>';
  document.getElementById('hint-label').textContent = '';
  document.getElementById('progress').style.width = '0%';

  setDiffBadge(currentLevel);
  renderFact('');
  input.focus();
}

/* input handler */
document.getElementById('typing-input').addEventListener('input', function(e) {
  if (finished || paused) return;
  var typed = e.target.value;
  if (!started && typed.length > 0) {
    started = true;
    document.getElementById('pause-btn').disabled = false;
    startTimer();
  }
  renderFact(typed);
  updateStats(typed);
  if (typed.length >= currentFact.text.length) {
    finished = true;
    stopTimer();
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('time-val').innerHTML = elapsed.toFixed(1) + '<span class="stat-unit">s</span>';
    updateStats(typed);
    showResult(typed);
    e.target.disabled = true;
  }
});

document.getElementById('next-btn').addEventListener('click', function() {
  queueIndexes[currentLevel] = (queueIndexes[currentLevel] + 1) % queues[currentLevel].length;
  loadFact(queues[currentLevel][queueIndexes[currentLevel]]);
});

document.getElementById('retry-btn').addEventListener('click', function() {
  loadFact(currentFact);
});

/* init */
loadFact(queues.easy[0]);