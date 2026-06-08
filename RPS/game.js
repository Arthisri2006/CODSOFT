'use strict';
/* ============================================================
   ROCK PAPER SCISSORS · Best of 10
   game.js — clean, single-pass, no duplication
   Python backend logic faithfully ported to JavaScript
   ============================================================ */

// ── Constants ─────────────────────────────────────────────────
const MAX_ROUNDS = 10;
const ITEMS      = ['rock', 'paper', 'scissors'];
const EMOJI      = { rock: '✊', paper: '✋', scissors: '✌️' };

// ── State ──────────────────────────────────────────────────────
const state = {
  playerName : '',
  wins       : 0,
  draws      : 0,
  losses     : 0,
  round      : 1,     // 1-indexed, becomes 11 when game ends
  history    : [],    // { round, user, cpu, result }
  busy       : false, // true while animation plays
  done       : false, // true after round 10
};

// ── DOM helpers ────────────────────────────────────────────────
const el = id => document.getElementById(id);

// Name screen
const nameScreen   = el('name-screen');
const nameInput    = el('name-input');
const nameError    = el('name-error');
const btnStart     = el('start-btn');

// Game screen
const gameScreen   = el('game-screen');
const playerLabel  = el('player-label');

// Arena
const playerOrb    = el('player-orb');
const playerEmoji  = el('player-emoji');
const playerChoice = el('player-choice');
const cpuOrb       = el('cpu-orb');
const cpuEmoji     = el('cpu-emoji');
const cpuChoice    = el('cpu-choice');

// Result
const resultBanner = el('result-banner');
const resultText   = el('result-text');

// Scores
const scoreWins    = el('score-wins');
const scoreDraws   = el('score-draws');
const scoreLosses  = el('score-losses');

// Round bar
const roundCurrent = el('round-current');
const dotsRow      = el('dots-row');
const progressFill = el('progress-fill');

// History drawer
const btnHistory       = el('btn-history');
const drawerBackdrop   = el('drawer-backdrop');
const historyDrawer    = el('history-drawer');
const btnCloseDrawer   = el('btn-close-drawer');
const historyList      = el('history-list');

// Final overlay
const finalOverlay  = el('final-overlay');
const finalCanvas   = el('final-canvas');
const finalCtx      = finalCanvas.getContext('2d');
const finalIcon     = el('final-icon');
const finalTitle    = el('final-title');
const finalName     = el('final-name');
const finalMessage  = el('final-message');
const fWins         = el('f-wins');
const fDraws        = el('f-draws');
const fLosses       = el('f-losses');
const finalDots     = el('final-dots');
const btnPlayAgain  = el('btn-play-again');
const btnChangeName = el('btn-change-player');

// Particle canvas
const bgCanvas = el('bg-canvas');
const bgCtx    = bgCanvas.getContext('2d');

// ── Utility ────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function resizeCanvas(canvas) {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ══════════════════════════════════════════════════════════════
// NAME ENTRY SCREEN
// ══════════════════════════════════════════════════════════════

// Auto-focus on load (script is at bottom of <body>, DOM is ready)
nameInput.focus();

function startGame() {
  const name = nameInput.value.trim();

  if (!name) {
    nameError.textContent = 'Please enter your name to continue!';
    nameInput.classList.add('error');
    nameInput.focus();
    return;
  }

  state.playerName = name;
  playerLabel.textContent = name.length > 12 ? name.slice(0, 12) + '…' : name;

  // Fade out name screen → reveal game
  nameScreen.classList.add('fade-out');
  setTimeout(() => {
    nameScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    buildDots();
  }, 450);
}

nameInput.addEventListener('input', () => {
  nameError.textContent = '';
  nameInput.classList.remove('error');
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); startGame(); }
});

btnStart.addEventListener('click', startGame);

// ══════════════════════════════════════════════════════════════
// CORE GAME LOGIC  ← Python backend ported directly
// ══════════════════════════════════════════════════════════════

function getComputerChoice() {
  return ITEMS[Math.floor(Math.random() * ITEMS.length)];
}

function getResult(user, cpu) {
  if (user === cpu) return 'draw';
  if (
    (user === 'rock'     && cpu === 'scissors') ||
    (user === 'paper'    && cpu === 'rock')     ||
    (user === 'scissors' && cpu === 'paper')
  ) return 'win';
  return 'loss';
}

// ══════════════════════════════════════════════════════════════
// PLAY A ROUND
// ══════════════════════════════════════════════════════════════

async function play(userChoice) {
  if (state.busy || state.done) return;
  state.busy = true;
  setChoiceBtns(true);

  // --- Reset arena to "thinking" state ---
  clearOrbGlow();
  playerEmoji.textContent = '🤔';
  cpuEmoji.textContent    = '🤔';
  playerChoice.textContent = '…';
  cpuChoice.textContent    = '…';
  resultText.textContent   = 'Fighting…';
  resultBanner.className   = 'result-banner';

  // --- Slot-machine spinner ---
  const frames = ['✊', '✋', '✌️'];
  let tick = 0;
  const spinner = setInterval(() => {
    cpuEmoji.textContent    = frames[tick % 3];
    playerEmoji.textContent = frames[(tick + 1) % 3];
    tick++;
  }, 110);

  await sleep(850);
  clearInterval(spinner);

  // --- Resolve result (Python logic) ---
  const cpu    = getComputerChoice();
  const result = getResult(userChoice, cpu);

  // --- Reveal choices with pop-in animation ---
  revealOrb(playerOrb, playerEmoji, playerChoice, userChoice);
  revealOrb(cpuOrb,    cpuEmoji,    cpuChoice,    cpu);
  await sleep(200);

  // --- Glow orbs ---
  applyOrbGlow(result);

  // --- Result banner ---
  const LABELS = {
    win:  `🎉 ${state.playerName} Wins This Round!`,
    draw: `🤝 It's a Draw!`,
    loss: `💀 CPU Wins This Round!`,
  };
  resultText.textContent = LABELS[result];
  resultBanner.className = `result-banner ${result}`;

  // --- Update scores ---
  if (result === 'win')  { state.wins++;   bump(scoreWins,   state.wins);   bgBurst('#10b981', 80); }
  if (result === 'draw') { state.draws++;  bump(scoreDraws,  state.draws);  bgBurst('#f59e0b', 40); }
  if (result === 'loss') { state.losses++; bump(scoreLosses, state.losses); bgBurst('#ef4444', 50); }

  // --- Record history ---
  state.history.push({ round: state.round, user: userChoice, cpu, result });
  addHistoryRow(state.round, userChoice, cpu, result);

  // --- Advance dot & progress ---
  setDot(state.round, result);
  state.round++;
  progressFill.style.width = `${((state.round - 1) / MAX_ROUNDS) * 100}%`;
  roundCurrent.textContent  = Math.min(state.round, MAX_ROUNDS);

  await sleep(700);

  // --- End of series? ---
  if (state.round > MAX_ROUNDS) {
    state.done = true;
    await sleep(400);
    showFinalResult();
  } else {
    setChoiceBtns(false);
  }

  state.busy = false;
}

// ══════════════════════════════════════════════════════════════
// FINAL FULL-SCREEN RESULT
// ══════════════════════════════════════════════════════════════

function showFinalResult() {
  const { wins, draws, losses, playerName } = state;

  fWins.textContent   = wins;
  fDraws.textContent  = draws;
  fLosses.textContent = losses;

  // Build breakdown dots
  finalDots.innerHTML = '';
  state.history.forEach(h => {
    const d = document.createElement('div');
    d.className = `dot ${h.result}`;
    d.title = `Round ${h.round}: ${h.result.toUpperCase()}`;
    finalDots.appendChild(d);
  });

  // Resize canvas for full-screen particles
  resizeCanvas(finalCanvas);

  if (wins > losses) {
    // 🏆 WIN
    finalIcon.textContent    = '🏆';
    finalTitle.className     = 'final-title';
    finalTitle.textContent   = 'Congratulations!';
    finalName.textContent    = `🌟 ${playerName} 🌟`;
    finalMessage.innerHTML   = `You <strong>won the series ${wins}–${losses}</strong>! Incredible performance — the CPU had no answer for you!`;
    finalBurst('#a78bfa', 160);
    finalBurst('#10b981', 120);
    finalBurst('#38bdf8', 100);
  } else if (losses > wins) {
    // 😔 LOSS
    finalIcon.textContent    = '😔';
    finalTitle.className     = 'final-title loss-title';
    finalTitle.textContent   = 'Better Luck Next Time!';
    finalName.textContent    = playerName;
    finalMessage.innerHTML   = `The CPU won <strong>${losses}–${wins}</strong> this time. Don't give up, ${playerName} — one more game and you might flip it! 💪`;
    finalBurst('#ef4444', 70);
  } else {
    // 🤝 TIE
    finalIcon.textContent    = '🤝';
    finalTitle.className     = 'final-title tie-title';
    finalTitle.textContent   = "It's a Tie!";
    finalName.textContent    = playerName;
    finalMessage.innerHTML   = `Both you and the CPU scored <strong>${wins} win${wins !== 1 ? 's' : ''} each</strong>. A perfectly balanced match — can you break the tie?`;
    finalBurst('#f59e0b', 90);
  }

  startFinalParticles();
  setTimeout(() => finalOverlay.classList.add('show'), 80);
}

// ══════════════════════════════════════════════════════════════
// HISTORY DRAWER
// ══════════════════════════════════════════════════════════════

function openDrawer() {
  historyDrawer.classList.add('open');
  drawerBackdrop.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  historyDrawer.classList.remove('open');
  drawerBackdrop.classList.remove('show');
  document.body.style.overflow = '';
}

function addHistoryRow(roundNum, user, cpu, result) {
  const empty = el('history-empty');
  if (empty) empty.remove();

  const row = document.createElement('div');
  row.className = `history-row ${result}`;
  row.innerHTML = `
    <span class="row-round">R${roundNum}</span>
    <div class="row-match">
      <span>${EMOJI[user]}</span>
      <span class="row-vs">vs</span>
      <span>${EMOJI[cpu]}</span>
    </div>
    <span class="row-result">${
      result === 'win'  ? '✓ Your Win' :
      result === 'loss' ? '✗ CPU Win'  : '= Draw'
    }</span>
  `;
  historyList.prepend(row);
}

btnHistory.addEventListener('click', openDrawer);
btnCloseDrawer.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);

// ══════════════════════════════════════════════════════════════
// RESET GAME
// ══════════════════════════════════════════════════════════════

function resetGame() {
  // Reset state (keep playerName)
  Object.assign(state, { wins: 0, draws: 0, losses: 0, round: 1, history: [], busy: false, done: false });

  // Scores
  scoreWins.textContent   = '0';
  scoreDraws.textContent  = '0';
  scoreLosses.textContent = '0';

  // Round bar
  roundCurrent.textContent  = '1';
  progressFill.style.width  = '0%';
  buildDots();

  // Arena
  playerEmoji.textContent  = '❓';
  cpuEmoji.textContent     = '❓';
  playerChoice.textContent = '–';
  cpuChoice.textContent    = '–';
  clearOrbGlow();

  // Banner
  resultText.textContent = 'Make your move!';
  resultBanner.className = 'result-banner';

  // History
  historyList.innerHTML = '<p id="history-empty" class="history-empty">No rounds yet. Start playing!</p>';

  // Close overlays
  finalOverlay.classList.remove('show');
  finalParticles = [];
  closeDrawer();
  setChoiceBtns(false);
}

function changePlayer() {
  resetGame();
  state.playerName = '';

  // Show name screen again
  nameScreen.classList.remove('hidden', 'fade-out');
  gameScreen.classList.add('hidden');

  nameInput.value = '';
  nameError.textContent = '';
  nameInput.classList.remove('error');

  // Delay focus so transition completes
  setTimeout(() => nameInput.focus(), 50);
}

btnPlayAgain.addEventListener('click', resetGame);
btnChangeName.addEventListener('click', changePlayer);
el('btn-new-game').addEventListener('click', resetGame);

// ══════════════════════════════════════════════════════════════
// CHOICE BUTTONS & KEYBOARD
// ══════════════════════════════════════════════════════════════

document.querySelectorAll('.choice-btn').forEach(btn => {
  btn.addEventListener('click', () => play(btn.dataset.choice));
});

document.addEventListener('keydown', e => {
  if (!state.playerName || state.busy || state.done) return;
  const map = { r: 'rock', p: 'paper', s: 'scissors' };
  const choice = map[e.key.toLowerCase()];
  if (choice) play(choice);
});

function setChoiceBtns(disabled) {
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = disabled);
}

// ══════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════

function revealOrb(orb, emojiEl, choiceEl, choice) {
  orb.classList.remove('reveal');
  void orb.offsetWidth; // reflow to restart animation
  orb.classList.add('reveal');
  emojiEl.textContent  = EMOJI[choice];
  choiceEl.textContent = choice.charAt(0).toUpperCase() + choice.slice(1);
}

function applyOrbGlow(result) {
  const map = {
    win:  ['glow-win',  'glow-loss'],
    draw: ['glow-draw', 'glow-draw'],
    loss: ['glow-loss', 'glow-win'],
  };
  playerOrb.classList.add(map[result][0]);
  cpuOrb.classList.add(map[result][1]);
}

function clearOrbGlow() {
  ['glow-win', 'glow-draw', 'glow-loss', 'reveal'].forEach(c => {
    playerOrb.classList.remove(c);
    cpuOrb.classList.remove(c);
  });
}

function bump(el, val) {
  el.textContent = val;
  el.classList.remove('score-bump');
  void el.offsetWidth;
  el.classList.add('score-bump');
}

// ── Dot management ─────────────────────────────────────────────
function buildDots() {
  dotsRow.innerHTML = '';
  for (let i = 1; i <= MAX_ROUNDS; i++) {
    const d = document.createElement('div');
    d.className = `dot${i === 1 ? ' active' : ''}`;
    d.id = `dot-${i}`;
    dotsRow.appendChild(d);
  }
}

function setDot(roundNum, result) {
  const current = el(`dot-${roundNum}`);
  if (current) {
    current.classList.remove('active');
    current.classList.add(result);
  }
  const next = el(`dot-${roundNum + 1}`);
  if (next) next.classList.add('active');
}

// ══════════════════════════════════════════════════════════════
// BACKGROUND PARTICLE SYSTEM
// ══════════════════════════════════════════════════════════════

let bgParticles = [];

resizeCanvas(bgCanvas);
window.addEventListener('resize', () => resizeCanvas(bgCanvas));

function bgBurst(color, count) {
  const cx = bgCanvas.width  / 2;
  const cy = bgCanvas.height / 2;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    bgParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 4 + Math.random() * 5,
      color,
      alpha: 1,
      decay: .013 + Math.random() * .018,
    });
  }
}

(function bgLoop() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgParticles = bgParticles.filter(p => p.alpha > 0);
  for (const p of bgParticles) {
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += .13;
    p.vx *= .98;
    p.alpha -= p.decay;
    bgCtx.globalAlpha = Math.max(0, p.alpha);
    bgCtx.fillStyle = p.color;
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.fill();
  }
  bgCtx.globalAlpha = 1;
  requestAnimationFrame(bgLoop);
})();

// ══════════════════════════════════════════════════════════════
// FINAL OVERLAY PARTICLE SYSTEM
// ══════════════════════════════════════════════════════════════

let finalParticles = [];
let finalLoopRunning = false;

window.addEventListener('resize', () => resizeCanvas(finalCanvas));

function finalBurst(color, count) {
  const cx = finalCanvas.width  / 2;
  const cy = finalCanvas.height / 2;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    finalParticles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      r: 5 + Math.random() * 6,
      color,
      alpha: 1,
      decay: .007 + Math.random() * .014,
    });
  }
}

function startFinalParticles() {
  if (finalLoopRunning) return;
  finalLoopRunning = true;

  function loop() {
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalParticles = finalParticles.filter(p => p.alpha > 0);
    for (const p of finalParticles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += .14;
      p.vx *= .98;
      p.alpha -= p.decay;
      finalCtx.globalAlpha = Math.max(0, p.alpha);
      finalCtx.fillStyle = p.color;
      finalCtx.beginPath();
      finalCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      finalCtx.fill();
    }
    finalCtx.globalAlpha = 1;

    if (finalOverlay.classList.contains('show')) {
      requestAnimationFrame(loop);
    } else {
      finalLoopRunning = false;
    }
  }

  requestAnimationFrame(loop);
}
