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

/* ── state ── */
let currentLevel = 'easy';
let queues = { easy: shuffle(allFacts.easy), medium: shuffle(allFacts.medium), hard: shuffle(allFacts.hard) };
let queueIndexes = { easy: 0, medium: 0, hard: 0 };
let currentFact = queues.easy[0];
let started = false, finished = false, paused = false;
let timerInterval = null, elapsed = 0;
let scores = [];
let focusMode = false;

function shuffle(arr) { return [...arr].sort(function() { return Math.random() - 0.5; }); }

/* ── theme toggle ── */
var themeBtn = document.getElementById('theme-btn');
themeBtn.addEventListener('click', function() {
  var html = document.documentElement;
  if (html.getAttribute('data-theme') === 'dark') {
    html.setAttribute('data-theme', 'light');
    themeBtn.innerHTML = '&#9790;'; /* crescent moon */
  } else {
    html.setAttribute('data-theme', 'dark');
    themeBtn.innerHTML = '&#9788;'; /* sun */
  }
});

/* ── level switching ── */
document.querySelectorAll('.level-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.level-btn').forEach(function(b) { b.className = 'level-btn'; });
    btn.classList.add('active-' + btn.dataset.level);
    currentLevel = btn.dataset.level;
    loadFact(queues[currentLevel][queueIndexes[currentLevel]]);
  });
});

/* ── rendering ── */
function buildFrags(text, typed) {
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
  return frags.join('');
}

function renderFact(typed) {
  var html = buildFrags(currentFact.text, typed);
  document.getElementById('fact-display').innerHTML = html;
  document.getElementById('fact-cat').textContent = currentFact.cat;
  var pct = Math.min(100, Math.round((typed.length / currentFact.text.length) * 100));
  document.getElementById('progress').style.width = pct + '%';
  if (focusMode) {
    document.getElementById('focus-display').innerHTML = html;
    document.getElementById('focus-cat').textContent = currentFact.cat;
    document.getElementById('focus-progress').style.width = pct + '%';
  }
}

function setDiffBadge(level) {
  var badge = document.getElementById('diff-badge');
  badge.textContent = level.charAt(0).toUpperCase() + level.slice(1);
  badge.className = 'diff-badge ' + level;
}

/* ── stats ── */
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
  var wpmHtml = (started && elapsed > 0 ? s.wpm : '—') + '<span class="stat-unit">wpm</span>';
  var accHtml = (typed.length > 0 ? s.acc : '—') + '<span class="stat-unit">%</span>';
  document.getElementById('wpm-val').innerHTML = wpmHtml;
  document.getElementById('acc-val').innerHTML = accHtml;
  if (focusMode) {
    document.getElementById('focus-wpm').innerHTML = (started && elapsed > 0 ? s.wpm : '—') + '<span class="stat-unit">wpm</span>';
    document.getElementById('focus-acc').innerHTML = (typed.length > 0 ? s.acc : '—') + '<span class="stat-unit">%</span>';
  }
}

/* ── timer ── */
function startTimer() {
  var startTime = Date.now() - (elapsed * 1000);
  timerInterval = setInterval(function() {
    elapsed = (Date.now() - startTime) / 1000;
    var timeHtml = elapsed.toFixed(1) + '<span class="stat-unit">s</span>';
    document.getElementById('time-val').innerHTML = timeHtml;
    if (focusMode) document.getElementById('focus-time').innerHTML = timeHtml;
    updateStats(document.getElementById(focusMode ? 'focus-input' : 'typing-input').value);
  }, 100);
}
function stopTimer() { clearInterval(timerInterval); timerInterval = null; }

/* ── pause ── */
function setPaused(val) {
  paused = val;
  var mainBtn = document.getElementById('pause-btn');
  var focusBtn = document.getElementById('focus-pause');
  var cover = document.getElementById('pause-cover');
  var input = document.getElementById(focusMode ? 'focus-input' : 'typing-input');
  var timeStat = document.getElementById('time-stat');

  if (paused) {
    stopTimer();
    mainBtn.innerHTML = '&#9654;';
    focusBtn.innerHTML = '&#9654;';
    mainBtn.classList.add('is-paused');
    focusBtn.classList.add('is-paused');
    if (!focusMode) cover.classList.add('visible');
    timeStat.classList.add('paused');
    input.disabled = true;
  } else {
    startTimer();
    mainBtn.innerHTML = '&#9646;&#9646;';
    focusBtn.innerHTML = '&#9646;&#9646;';
    mainBtn.classList.remove('is-paused');
    focusBtn.classList.remove('is-paused');
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
document.getElementById('focus-pause').addEventListener('click', function() {
  if (!started || finished) return;
  setPaused(!paused);
});

/* ── result ── */
function showResult(typed) {
  var s = calcStats(typed);
  scores.push({ wpm: s.wpm, acc: s.acc, fact: currentFact.text, level: currentLevel });
  scores.sort(function(a, b) { return b.wpm - a.wpm; });
  renderLeaderboard();

  var reactions = [
    [120, "Are your fingers even real?",  s.wpm + " wpm - you must part robot or full bot. Deeply suspicious of you."],
    [90,  "Absolutely blazing lol.",           s.wpm + " wpm, " + s.acc + "% accuracy. Your keyboard is very scared & frightened by you."],
    [60,  "Solid typing!",                 s.wpm + " wpm - comfortably above average. The fact has been typed :)."],
    [40,  "Decent effort!",                s.wpm + " wpm - you typed it, and that's what really matters deep down."],
    [0,   "Nice & steady!",              s.wpm + " wpm - the important thing is you learned something fun like a new random fun fact."],
  ];
  var match = reactions.find(function(r) { return s.wpm >= r[0]; });

  document.getElementById('result-title').textContent = match[1];
  document.getElementById('result-desc').textContent = match[2];
  document.getElementById('result-banner').classList.add('show');
  document.getElementById('hint-label').textContent = 'Press Next fact for a new fact';

  if (focusMode) {
    document.getElementById('focus-result-title').textContent = match[1];
    document.getElementById('focus-result-desc').textContent = match[2];
    document.getElementById('focus-result').classList.add('show');
  }
}

function renderLeaderboard() {
  var body = document.getElementById('lb-body');
  if (scores.length === 0) {
    body.innerHTML = '<div class="lb-empty">No runs yet. Finish a fun fact to see your scores!</div>';
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

/* ── load fact ── */
function loadFact(fact) {
  currentFact = fact;
  started = false; finished = false; paused = false; elapsed = 0;
  stopTimer();

  var mainInput = document.getElementById('typing-input');
  var focusInput = document.getElementById('focus-input');
  var mainBtn = document.getElementById('pause-btn');
  var focusBtn = document.getElementById('focus-pause');
  var cover = document.getElementById('pause-cover');
  var timeStat = document.getElementById('time-stat');

  mainInput.value = '';
  focusInput.value = '';
  mainInput.disabled = false;
  focusInput.disabled = false;

  mainBtn.innerHTML = '&#9646;&#9646;';
  focusBtn.innerHTML = '&#9646;&#9646;';
  mainBtn.classList.remove('is-paused');
  focusBtn.classList.remove('is-paused');
  mainBtn.disabled = true;
  focusBtn.disabled = true;
  cover.classList.remove('visible');
  timeStat.classList.remove('paused');

  document.getElementById('result-banner').classList.remove('show');
  document.getElementById('focus-result').classList.remove('show');
  var zeroTime = '0<span class="stat-unit">s</span>';
  document.getElementById('time-val').innerHTML = zeroTime;
  document.getElementById('focus-time').innerHTML = zeroTime;
  document.getElementById('wpm-val').innerHTML = '—<span class="stat-unit">wpm</span>';
  document.getElementById('acc-val').innerHTML = '—<span class="stat-unit">%</span>';
  document.getElementById('focus-wpm').innerHTML = '—<span class="stat-unit">wpm</span>';
  document.getElementById('focus-acc').innerHTML = '—<span class="stat-unit">%</span>';
  document.getElementById('hint-label').textContent = '';
  document.getElementById('progress').style.width = '0%';
  document.getElementById('focus-progress').style.width = '0%';

  setDiffBadge(currentLevel);
  renderFact('');
  if (focusMode) focusInput.focus();
  else mainInput.focus();
}

/* ── shared input handler ── */
function handleInput(typed, inputEl) {
  if (finished || paused) return;
  if (!started && typed.length > 0) {
    started = true;
    document.getElementById('pause-btn').disabled = false;
    document.getElementById('focus-pause').disabled = false;
    startTimer();
  }
  renderFact(typed);
  updateStats(typed);
  if (typed.length >= currentFact.text.length) {
    finished = true;
    stopTimer();
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('focus-pause').disabled = true;
    var timeHtml = elapsed.toFixed(1) + '<span class="stat-unit">s</span>';
    document.getElementById('time-val').innerHTML = timeHtml;
    if (focusMode) document.getElementById('focus-time').innerHTML = timeHtml;
    updateStats(typed);
    showResult(typed);
    inputEl.disabled = true;
  }
}

document.getElementById('typing-input').addEventListener('input', function(e) {
  handleInput(e.target.value, e.target);
});
document.getElementById('focus-input').addEventListener('input', function(e) {
  handleInput(e.target.value, e.target);
});

/* ── next / retry ── */
function nextFact() {
  queueIndexes[currentLevel] = (queueIndexes[currentLevel] + 1) % queues[currentLevel].length;
  loadFact(queues[currentLevel][queueIndexes[currentLevel]]);
}
document.getElementById('next-btn').addEventListener('click', nextFact);
document.getElementById('focus-next').addEventListener('click', nextFact);
document.getElementById('retry-btn').addEventListener('click', function() { loadFact(currentFact); });
document.getElementById('focus-retry').addEventListener('click', function() { loadFact(currentFact); });

/* ── focus mode ── */
var focusBtn2 = document.getElementById('focus-btn');
var focusOverlay = document.getElementById('focus-overlay');

function openFocus() {
  focusMode = true;
  focusOverlay.classList.add('open');
  focusBtn2.classList.add('active');
  /* sync focus display with current state */
  renderFact(document.getElementById('typing-input').value);
  document.getElementById('focus-input').value = document.getElementById('typing-input').value;
  document.getElementById('focus-input').focus();
}
function closeFocus() {
  focusMode = false;
  focusOverlay.classList.remove('open');
  focusBtn2.classList.remove('active');
  /* sync main display */
  renderFact(document.getElementById('focus-input').value);
  document.getElementById('typing-input').value = document.getElementById('focus-input').value;
  document.getElementById('typing-input').focus();
}

focusBtn2.addEventListener('click', openFocus);
document.getElementById('focus-exit').addEventListener('click', closeFocus);
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (focusMode) closeFocus();
    else closeModal();
  }
});

/* ── tips modal ── */
function openModal() { document.getElementById('modal-backdrop').classList.add('open'); }
function closeModal() { document.getElementById('modal-backdrop').classList.remove('open'); }
document.getElementById('tips-btn').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-backdrop').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

/* ── init ── */
loadFact(queues.easy[0]);