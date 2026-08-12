/**
 * UIManager.js  —  All DOM interactions.
 *
 * Manages: loading screen, menu, HUD (score/streak/pills),
 * question card, hint, aim ring, power bar, feedback banner, game-over screen.
 */

import { GOAL_W, GOAL_H, CARD_COLORS, LETTERS, QUESTIONS_PER_GAME } from '../constants.js';

export class UIManager {
  constructor() {
    // Screens
    this.loading = document.getElementById('loadingScreen');
    this.menu = document.getElementById('menuScreen');
    this.hud = document.getElementById('hud');
    this.qCard = document.getElementById('questionCard');
    this.fbOverlay = document.getElementById('feedbackOverlay');
    this.fbBanner = document.getElementById('feedbackBanner');
    this.goScreen = document.getElementById('gameOverScreen');

    // HUD elements
    this.scoreEl = document.getElementById('scoreValue');
    this.streakEl = document.getElementById('streakValue');
    this.qLabel = document.getElementById('qNumLabel');
    this.pills = document.getElementById('questionPills');

    // Question card
    this.defEl = document.getElementById('definitionText');
    this.optRow = document.getElementById('optionsRow');
    this.hintBtn = document.getElementById('hintBtn');
    this.hintEl = document.getElementById('hintText');
    this.aimHint = document.getElementById('aimInstructions');

    // Game-over
    this.goScore = document.getElementById('goScoreBig');
    this.goCorrect = document.getElementById('goCorrect');
    this.goStreak = document.getElementById('goStreak');
    this.goAccuracy = document.getElementById('goAccuracy');
    this.starsRow = document.getElementById('starsRow');
    this.resultList = document.getElementById('resultList');

    this._hintVisible = false;
  }

  showLoading() { this.loading.style.display = 'flex'; }
  hideLoading() { this.loading.style.display = 'none'; }
  showMenu() { this.menu.style.display = 'flex'; }
  hideMenu() { this.menu.style.display = 'none'; }

  showGame() {
    this.hud.style.display = 'flex';
    this.qCard.style.display = 'block';
  }

  hideGame() {
    this.hud.style.display = 'none';
    this.qCard.style.display = 'none';
  }

  showGameOver() { this.goScreen.style.display = 'flex'; }
  hideGameOver() { this.goScreen.style.display = 'none'; }

  // ── HUD ──────────────────────────────────────────────────────────

  buildPills() {
    this.pills.innerHTML = '';
    for (let i = 0; i < QUESTIONS_PER_GAME; i++) {
      const p = document.createElement('div');
      p.className = 'qPill';
      p.id = `pill${i}`;
      this.pills.appendChild(p);
    }
    this._markPill(0, 'current');
  }

  _markPill(idx, cls) {
    const el = document.getElementById(`pill${idx}`);
    if (el) { el.className = `qPill ${cls}`; }
  }

  markPillCorrect(idx) { this._markPill(idx, 'correct'); }
  markPillWrong(idx) { this._markPill(idx, 'wrong'); }
  markPillCurrent(idx) { this._markPill(idx, 'current'); }

  updateHUD(score, streak, qIdx) {
    this.scoreEl.textContent = score;
    this.streakEl.textContent = streak;
    this.qLabel.textContent = `Q. ${qIdx + 1} / ${QUESTIONS_PER_GAME}`;
  }

  // ── Question card ────────────────────────────────────────────────

  setQuestion(qObj) {
    this.defEl.textContent = `"${qObj.definition}"`;
    this.hintEl.textContent = `Hint: ${qObj.mnemonic}`;
    this.hintEl.style.display = 'none';
    this.hintBtn.style.display = 'inline-block';

    // Render options
    this.optRow.innerHTML = '';
    qObj.options.forEach((opt, idx) => {
      const color = CARD_COLORS[idx];
      const letter = LETTERS[idx];
      const div = document.createElement('div');
      div.className = 'optItem';
      div.style.color = '#ccc';
      div.innerHTML = `<span class="optLetter" style="background:${color}">${letter}</span> ${opt}`;
      this.optRow.appendChild(div);
    });
  }

  toggleHint() {
    this._hintVisible = !this._hintVisible;
    this.hintEl.style.display = this._hintVisible ? 'inline' : 'none';
  }

  // ── Feedback banner ──────────────────────────────────────────────

  showFeedback(correct, word, definition, points, customTitle = null) {
    const GOAL_EMOJIS = ['⚽🎉', '🥅✨', '💯🔥', '🎯⚡', '🌟💥'];
    const MISS_EMOJIS = ['😬🧤', '🙈❌', '💨🤦', '🛑😮', '😤🧤'];
    const GOAL_TITLES = ['Gooal!', 'Perfect Shot!', 'BullsEye!', 'Amazing!', 'Great Kick!'];
    const MISS_TITLES = ['Blocked!', 'Caught!', 'Wrong Answer!', 'Saved!', 'Missed!'];

    const idx = Math.floor(Math.random() * 5);
    document.getElementById('feedbackEmoji').textContent = correct ? GOAL_EMOJIS[idx] : MISS_EMOJIS[idx];
    const titleEl = document.getElementById('feedbackTitle');

    if (customTitle) {
      titleEl.textContent = customTitle;
    } else {
      titleEl.textContent = correct ? GOAL_TITLES[idx] : MISS_TITLES[idx];
    }
    titleEl.style.color = correct ? '#22c55e' : '#ef4444';

    const ptsEl = document.getElementById('feedbackPoints');
    ptsEl.textContent = points > 0 ? `+${points} pts` : `${points} pts`;
    ptsEl.style.color = points > 0 ? '#ffd700' : '#ff6b35';

    const def = definition.length > 68 ? definition.slice(0, 66) + '…' : definition;
    this.fbBanner.className = '';
    void this.fbBanner.offsetWidth;
    this.fbBanner.classList.add(correct ? 'correct' : 'wrong');
    requestAnimationFrame(() => this.fbBanner.classList.add('show'));
  }

  hideFeedback() {
    this.fbBanner.classList.remove('show');
    setTimeout(() => { this.fbBanner.className = ''; }, 450);
  }

  // ── Game-over screen ─────────────────────────────────────────────

  showResults(score, correct, maxStreak) {
    this.goScore.textContent = score;
    this.goCorrect.textContent = correct;
    this.goStreak.textContent = maxStreak;
    this.goAccuracy.textContent = `${Math.round((correct / QUESTIONS_PER_GAME) * 100)}%`;
    this.starsRow.textContent =
      correct >= 8 ? '⭐⭐⭐' : correct >= 5 ? '⭐⭐' : correct >= 3 ? '⭐' : '😔';

    this.resultList.innerHTML = '';
  }
}
