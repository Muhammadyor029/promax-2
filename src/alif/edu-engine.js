import { getKidsProgress } from './edu-engine-legacy.js';

export {
  onBgReady,
  UZ_ALPHABET,
  EDU_ITEMS,
  playSound,
  drawEduCardFrame,
  getKidsProgress,
  recordKidsStars,
  celebrateKids,
  isEduGameOpen,
  closeEduGame,
  openPvpDuel,
  openEduGame
} from './edu-engine-legacy.js';

function syncKidsTotal() {
  const el = document.getElementById('kids-total');
  if (!el) return;
  const progress = getKidsProgress();
  el.textContent = `★ ${progress.stars}`;
  el.classList.remove('is-bump');
  void el.offsetWidth;
  el.classList.add('is-bump');
}

syncKidsTotal();
window.addEventListener('alif:kids-progress', syncKidsTotal);
