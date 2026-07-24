/* ==========================================================
   A Little Love Story — script.js
   All interaction logic, animations, audio, and particle
   systems for the interactive love book website.
   ========================================================== */

'use strict';

/* ===== CONFIGURATION ===== */
/* Edit story content, page count, and behavior here */
const CONFIG = {
  totalPages: 15,          // Total number of story pages
  swipeThreshold: 50,      // Minimum px to register a swipe
  pageFlipDelay: 800,      // Duration for page flip animation (ms)
  particleCount: 15,       // Particles emitted on events
  petalCount: 14,          // Number of falling sakura petals
  emojiPopInterval: 5000,  // Random emoji popup interval (ms)
  bgmVolume: 0.25,         // Background music volume (0-1)
  sfxVolume: 0.5,          // Sound effects volume (0-1)

  /* Emojis that randomly pop up around the edges */
  randomEmojis: ['💕', '🌸', '✨', '💗', '🌷', '💫', '🌺', '💖', '🦋', '⭐'],

  /* Particle types for different events */
  particles: {
    bookOpen:    ['💖', '💗', '💕', '✨', '🌸'],
    pageFlip:    ['🌸', '✨', '💫'],
    envelopeOpen:['💌', '💕', '💖', '✨'],
    giftOpen:    ['🎉', '🎊', '✨', '💝', '🌸'],
    ending:      ['💖', '💗', '💕', '✨', '🌸', '🎉', '💝'],
    heartTap:    ['💗', '💕', '✨'],
  },

  /* Confetti colors for celebration pages */
  confettiColors: ['#FF6B9D', '#FFD6E7', '#E9D8FF', '#FFE3D8', '#D8EEFF', '#FFD700', '#FF8FAD'],
};

/* ===== STATE ===== */
let state = {
  currentPage: 1,
  isBookOpen: false,
  isMuted: false,
  isTransitioning: false,
  audioStarted: false,
  heartTapCount: 0,
  heartUnlocked: false,
  envelopeOpened: false,
  giftOpened: false,
  countdownStarted: false,
  page11ConfettiDone: false,
  page15Done: false,

  /* Touch tracking */
  touchStartX: 0,
  touchStartY: 0,
  touchCurrentX: 0,

  /* Gift ribbon drag */
  ribbonDragging: false,
  ribbonStartX: 0,
  ribbonCurrentX: 0,
  ribbonMaxX: 0,
};

/* ===== DOM REFERENCES ===== */
const DOM = {
  openingScene:    () => document.getElementById('opening-scene'),
  app:             () => document.getElementById('app'),
  bookEl:          () => document.getElementById('book'),
  frontCover:      () => document.getElementById('front-cover'),
  pagesContainer:  () => document.getElementById('pages-container'),
  particleContainer:() => document.getElementById('particle-container'),
  petalsContainer: () => document.getElementById('petals-container'),
  starsContainer:  () => document.getElementById('stars-container'),
  muteBtn:         () => document.getElementById('mute-btn'),
  muteIcon:        () => document.getElementById('mute-icon'),
  pageIndicator:   () => document.getElementById('page-indicator'),
  currentPageNum:  () => document.getElementById('current-page-num'),
  totalPagesNum:   () => document.getElementById('total-pages-num'),
  navPrev:         () => document.getElementById('nav-prev'),
  navNext:         () => document.getElementById('nav-next'),

  /* Audio */
  audioBgm:        () => document.getElementById('audio-bgm'),
  audioBookOpen:   () => document.getElementById('audio-book-open'),
  audioPageFlip:   () => document.getElementById('audio-page-flip'),
  audioPop:        () => document.getElementById('audio-pop'),
  audioSparkle:    () => document.getElementById('audio-sparkle'),

  /* Page-specific */
  interactiveHeart:() => document.getElementById('interactive-heart'),
  heartTapCount:   () => document.getElementById('heart-tap-count'),
  heartPrompt:     () => document.getElementById('heart-prompt'),
  page5UnlockMsg:  () => document.getElementById('page5-unlock-msg'),
  envelope:        () => document.getElementById('envelope'),
  envelopeFlap:    () => document.getElementById('envelope-flap'),
  envelopePrompt:  () => document.getElementById('envelope-prompt'),
  letter:          () => document.getElementById('letter'),
  countdownNumber: () => document.getElementById('countdown-number'),
  countdownDisplay:() => document.getElementById('countdown-display'),
  countdownMessage:() => document.getElementById('countdown-message'),
  countdownPrompt: () => document.getElementById('countdown-prompt'),
  giftLid:         () => document.getElementById('gift-lid'),
  ribbonH:         () => document.getElementById('ribbon-h'),
  ribbonKnob:      () => document.getElementById('ribbon-knob'),
  giftOpenContent: () => document.getElementById('gift-open-content'),
  page11Confetti:  () => document.getElementById('page11-confetti'),
  endingConfetti:  () => document.getElementById('ending-confetti'),
  endingHearts:    () => document.getElementById('ending-hearts'),
  btnReadAgain:    () => document.getElementById('btn-read-again'),
  btnShare:        () => document.getElementById('btn-share'),
};

/* ===== AUDIO SYSTEM ===== */
/* ===== AUDIO CONTROL ===== */
const Audio = {
  /** Start background music after first user interaction */
  startBgm() {
    const bgm = DOM.audioBgm();
    if (!bgm || state.audioStarted) return;
    state.audioStarted = true;
    bgm.volume = CONFIG.bgmVolume;
    bgm.play().catch(() => {
      /* Browser may block autoplay — that's fine */
    });
  },

  /** Play a sound effect by element ID */
  play(audioEl) {
    if (state.isMuted || !audioEl) return;
    try {
      audioEl.currentTime = 0;
      audioEl.volume = CONFIG.sfxVolume;
      audioEl.play().catch(() => {});
    } catch (e) { /* ignore */ }
  },

  /** Toggle mute state */
  toggleMute() {
    state.isMuted = !state.isMuted;
    const bgm = DOM.audioBgm();
    if (bgm) bgm.muted = state.isMuted;
    DOM.muteIcon().textContent = state.isMuted ? '🔇' : '🔊';
    DOM.muteBtn().setAttribute('aria-label', state.isMuted ? 'Nyalakan suara' : 'Matikan suara');
  },
};

/* ===== PARTICLE SYSTEM ===== */
/* ===== PARTICLE SYSTEM ===== */
const Particles = {
  /** Emit particles from a given position or centre of screen */
  emit(type = 'pageFlip', x, y) {
    const emojis = CONFIG.particles[type] || CONFIG.particles.pageFlip;
    const container = DOM.particleContainer();
    const cx = x ?? window.innerWidth / 2;
    const cy = y ?? window.innerHeight / 2;

    for (let i = 0; i < CONFIG.particleCount; i++) {
      const p = document.createElement('span');
      p.className = 'particle-item';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.style.left   = `${cx + (Math.random() - 0.5) * 120}px`;
      p.style.top    = `${cy + (Math.random() - 0.5) * 80}px`;
      p.style.fontSize = `${12 + Math.random() * 18}px`;
      p.style.animationDuration = `${1 + Math.random() * 0.8}s`;
      p.style.animationDelay = `${Math.random() * 0.3}s`;
      p.style.setProperty('--tx', `${(Math.random() - 0.5) * 80}px`);
      container.appendChild(p);

      /* Remove from DOM after animation */
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  },

  /** Mini burst for heart tap */
  miniHeartBurst(x, y) {
    const container = DOM.particleContainer();
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('span');
      p.className = 'particle-item';
      p.textContent = CONFIG.particles.heartTap[Math.floor(Math.random() * CONFIG.particles.heartTap.length)];
      p.style.left = `${x + (Math.random() - 0.5) * 60}px`;
      p.style.top  = `${y + (Math.random() - 0.5) * 40}px`;
      p.style.fontSize = `${14 + Math.random() * 10}px`;
      p.style.animationDuration = `${0.8 + Math.random() * 0.5}s`;
      container.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  },
};

/* ===== CONFETTI SYSTEM ===== */
const Confetti = {
  /** Create confetti pieces inside a given container element */
  burst(containerEl, count = 40) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top  = `${-10 - Math.random() * 30}px`;
      piece.style.background = CONFIG.confettiColors[Math.floor(Math.random() * CONFIG.confettiColors.length)];
      piece.style.width  = `${6 + Math.random() * 8}px`;
      piece.style.height = `${6 + Math.random() * 8}px`;
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
      piece.style.animationDelay    = `${Math.random() * 0.8}s`;
      containerEl.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove(), { once: true });
    }
  },

  /** Continuous confetti for ending */
  continuousEnd(containerEl) {
    if (!containerEl) return;
    let running = true;
    const run = () => {
      if (!running) return;
      Confetti.burst(containerEl, 20);
      setTimeout(run, 2500);
    };
    run();
    return () => { running = false; };
  },
};

/* ===== FALLING PETALS ===== */
const Petals = {
  petals: ['🌸', '🌺', '🌷', '🌸', '🌸'],

  /** Spawn initial petals */
  init() {
    const container = DOM.petalsContainer();
    if (!container) return;
    for (let i = 0; i < CONFIG.petalCount; i++) {
      this.spawnPetal(container, i * (8000 / CONFIG.petalCount));
    }
  },

  spawnPetal(container, delay = 0) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.textContent = this.petals[Math.floor(Math.random() * this.petals.length)];

    const duration = 7000 + Math.random() * 8000;
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.fontSize = `${12 + Math.random() * 14}px`;
    petal.style.animationDuration = `${duration}ms`;
    petal.style.animationDelay    = `${delay}ms`;
    petal.style.opacity = `${0.4 + Math.random() * 0.4}`;

    container.appendChild(petal);

    /* Respawn after animation */
    setTimeout(() => {
      petal.remove();
      this.spawnPetal(container, 0);
    }, delay + duration);
  },
};

/* ===== OPENING STARS ===== */
function createOpeningStars() {
  const container = DOM.starsContainer();
  if (!container) return;

  for (let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.className = 'star-dot';

    const size = 1 + Math.random() * 3;
    star.style.width  = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left   = `${Math.random() * 100}%`;
    star.style.top    = `${Math.random() * 100}%`;
    star.style.animationDelay    = `${Math.random() * 2}s`;
    star.style.animationDuration = `${1.5 + Math.random() * 2}s`;

    container.appendChild(star);
  }
}

/* ===== RANDOM EMOJI POPUPS ===== */
function spawnRandomEmoji() {
  const emoji = CONFIG.randomEmojis[Math.floor(Math.random() * CONFIG.randomEmojis.length)];
  const el = document.createElement('span');
  el.className = 'random-emoji';
  el.textContent = emoji;

  /* Spawn at random edge position */
  const side = Math.floor(Math.random() * 4);
  if (side === 0) { el.style.top = '10%'; el.style.left = `${10 + Math.random() * 20}%`; }
  else if (side === 1) { el.style.top = '10%'; el.style.right = `${10 + Math.random() * 20}%`; }
  else if (side === 2) { el.style.bottom = '15%'; el.style.left = `${10 + Math.random() * 20}%`; }
  else { el.style.bottom = '15%'; el.style.right = `${10 + Math.random() * 20}%`; }

  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

/* ===== OPENING SCENE ===== */
/* ===== BOOK OPENING ===== */
function initOpeningScene() {
  createOpeningStars();

  const openingScene = DOM.openingScene();
  if (!openingScene) return;

  /* Tap / click to open */
  openingScene.addEventListener('click', handleOpeningTap);
  openingScene.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') handleOpeningTap();
  });
}

function handleOpeningTap() {
  const openingScene = DOM.openingScene();
  if (!openingScene) return;

  /* Start audio on first interaction */
  Audio.startBgm();

  /* Fade out opening scene */
  openingScene.classList.add('fade-out');

  setTimeout(() => {
    openingScene.classList.add('hidden');
    showApp();
  }, 800);
}

function showApp() {
  const app = DOM.app();
  app.classList.remove('hidden');

  /* Show front cover with particles */
  Particles.emit('bookOpen');
  Audio.play(DOM.audioSparkle());

  updatePageIndicator();
}

/* ===== BOOK COVER OPEN ===== */
function initBookCover() {
  const cover = DOM.frontCover();
  if (!cover) return;

  cover.addEventListener('click', openBook);
  cover.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openBook();
  });
}

function openBook() {
  if (state.isBookOpen) return;
  state.isBookOpen = true;

  const cover = DOM.frontCover();
  cover.classList.add('is-open');
  cover.setAttribute('aria-expanded', 'true');

  /* Sound */
  Audio.play(DOM.audioBookOpen());

  /* Emit heart particles from center of book */
  const rect = cover.getBoundingClientRect();
  Particles.emit('bookOpen', rect.left + rect.width / 2, rect.top + rect.height / 2);

  /* Show first page */
  setTimeout(() => {
    goToPage(1, 'next');
    cover.style.pointerEvents = 'none';
  }, 400);
}

/* ===== PAGE NAVIGATION ===== */
/* ===== PAGE FLIP ===== */
function getPageEl(num) {
  return document.querySelector(`.page[data-page="${num}"]`);
}

function goToPage(targetPage, direction = 'next') {
  if (state.isTransitioning) return;
  if (targetPage < 1 || targetPage > CONFIG.totalPages) return;

  const prevPage = state.currentPage;
  if (targetPage === prevPage && state.isBookOpen) return;

  state.isTransitioning = true;

  const fromEl = getPageEl(prevPage);
  const toEl   = getPageEl(targetPage);
  if (!toEl) { state.isTransitioning = false; return; }

  /* Play page flip sound */
  Audio.play(DOM.audioPageFlip());

  /* Emit subtle particles */
  Particles.emit('pageFlip');

  /* Animate out current page */
  if (fromEl && fromEl !== toEl) {
    fromEl.classList.add(direction === 'next' ? 'page-leaving' : 'page-leaving-next');
    setTimeout(() => {
      fromEl.classList.add('hidden-page');
      fromEl.classList.remove('page-leaving', 'page-leaving-next');
    }, CONFIG.pageFlipDelay);
  }

  /* Animate in new page */
  toEl.classList.remove('hidden-page');
  toEl.classList.add(direction === 'next' ? 'page-entering' : 'page-entering-prev');
  setTimeout(() => {
    toEl.classList.remove('page-entering', 'page-entering-prev');
    state.isTransitioning = false;
  }, CONFIG.pageFlipDelay);

  state.currentPage = targetPage;
  updatePageIndicator();

  /* Trigger page-specific logic */
  onPageEnter(targetPage, direction);
}

function nextPage() {
  if (state.currentPage < CONFIG.totalPages) {
    goToPage(state.currentPage + 1, 'next');
  }
}

function prevPage() {
  if (state.currentPage > 1) {
    goToPage(state.currentPage - 1, 'prev');
  }
}

function updatePageIndicator() {
  const cur = DOM.currentPageNum();
  const tot = DOM.totalPagesNum();
  if (cur) cur.textContent = state.currentPage;
  if (tot) tot.textContent = CONFIG.totalPages;
}

/* ===== PAGE-SPECIFIC LOGIC ===== */
/* ===== PAGE ENTER EVENTS ===== */
function onPageEnter(pageNum) {
  switch (pageNum) {
    case 1:  onPage1Enter();  break;
    case 2:  onPage2Enter();  break;
    case 5:  onPage5Enter();  break;
    case 6:  onPage6Enter();  break;
    case 10: onPage10Enter(); break;
    case 11: onPage11Enter(); break;
    case 12: onPage12Enter(); break;
    case 15: onPage15Enter(); break;
  }
}

/* -- Page 1: Typewriter reset -- */
function onPage1Enter() {
  const el = document.getElementById('page1-text');
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; /* force reflow */
  el.style.animation = '';
}

/* -- Page 2: Restart cloud drift -- */
function onPage2Enter() {
  const clouds = document.querySelectorAll('.moving-cloud');
  clouds.forEach(c => {
    c.style.animation = 'none';
    c.offsetHeight;
    c.style.animation = '';
  });
}

/* -- Page 5: Interactive heart reset -- */
function onPage5Enter() {
  if (state.heartUnlocked) {
    DOM.page5UnlockMsg()?.classList.remove('hidden');
    DOM.heartPrompt()?.classList.add('hidden');
  }
}

/* -- Page 6: Envelope reset if not opened -- */
function onPage6Enter() {
  if (!state.envelopeOpened) {
    DOM.envelope()?.classList.remove('is-open');
    DOM.letter()?.classList.add('hidden-letter');
    DOM.letter()?.classList.remove('letter-reveal');
  }
}

/* -- Page 10: Gift setup -- */
function onPage10Enter() {
  setupGiftRibbon();
}

/* -- Page 11: Confetti burst -- */
function onPage11Enter() {
  const container = DOM.page11Confetti();
  if (container) {
    Confetti.burst(container, 60);
    Audio.play(DOM.audioPop());
    Particles.emit('giftOpen');
  }
}

/* -- Page 12: Start countdown -- */
function onPage12Enter() {
  if (!state.countdownStarted) {
    state.countdownStarted = true;
    startCountdown();
  }
}

/* -- Page 15: Ending cinematic -- */
function onPage15Enter() {
  if (state.page15Done) return;
  state.page15Done = true;

  Audio.play(DOM.audioSparkle());
  Particles.emit('ending');

  /* Confetti burst */
  setTimeout(() => {
    Confetti.continuousEnd(DOM.endingConfetti());
    spawnEndingHearts();
  }, 600);
}

/* ===== PAGE 5: HEART INTERACTION ===== */
function initHeartInteraction() {
  const heart = DOM.interactiveHeart();
  if (!heart) return;

  const handleTap = (e) => {
    e.stopPropagation();
    if (state.heartUnlocked) return;

    state.heartTapCount++;
    Audio.play(DOM.audioPop());

    /* Visual feedback */
    heart.classList.remove('tapped');
    heart.offsetHeight;
    heart.classList.add('tapped');

    /* Mini particle burst */
    const rect = heart.getBoundingClientRect();
    Particles.miniHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);

    /* Update counter */
    const countEl = DOM.heartTapCount();
    if (countEl) countEl.textContent = `${state.heartTapCount} / 5`;

    if (state.heartTapCount >= 5) {
      state.heartUnlocked = true;
      DOM.page5UnlockMsg()?.classList.remove('hidden');
      DOM.heartPrompt()?.classList.add('hidden');
      heart.classList.remove('bounce');
      Particles.emit('heartTap');
      Audio.play(DOM.audioSparkle());
    }
  };

  heart.addEventListener('click', handleTap);
  heart.addEventListener('touchend', handleTap, { passive: false });
}

/* ===== PAGE 6: ENVELOPE ===== */
function initEnvelope() {
  const envelopeEl = DOM.envelope();
  if (!envelopeEl) return;

  const openEnvelope = (e) => {
    e.stopPropagation();
    if (state.envelopeOpened) return;
    state.envelopeOpened = true;

    envelopeEl.classList.add('is-open');
    envelopeEl.setAttribute('aria-expanded', 'true');

    Audio.play(DOM.audioPop());
    Particles.emit('envelopeOpen');

    /* Reveal letter */
    setTimeout(() => {
      const letter = DOM.letter();
      if (letter) {
        letter.classList.remove('hidden-letter');
        letter.classList.add('letter-reveal');
      }
      const prompt = DOM.envelopePrompt();
      if (prompt) prompt.classList.add('hidden');
    }, 500);
  };

  envelopeEl.addEventListener('click', openEnvelope);
  envelopeEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openEnvelope(e);
  });
}

/* ===== PAGE 10: GIFT RIBBON PUZZLE ===== */
function setupGiftRibbon() {
  const knob   = DOM.ribbonKnob();
  const ribbon = DOM.ribbonH();
  if (!knob || !ribbon || state.giftOpened) return;

  const track = ribbon.querySelector('.ribbon-slider-track');
  if (!track) return;

  /* Calculate draggable range */
  const trackRect = track.getBoundingClientRect();
  state.ribbonMaxX = trackRect.width - 40;

  const onStart = (clientX) => {
    state.ribbonDragging = true;
    state.ribbonStartX   = clientX - state.ribbonCurrentX;
  };

  const onMove = (clientX) => {
    if (!state.ribbonDragging || state.giftOpened) return;
    const newX = Math.max(0, Math.min(clientX - state.ribbonStartX, state.ribbonMaxX));
    state.ribbonCurrentX = newX;
    knob.style.left = `${newX}px`;

    /* Check if dragged far enough (80% of max) */
    if (newX >= state.ribbonMaxX * 0.8) {
      openGift();
    }
  };

  const onEnd = () => {
    state.ribbonDragging = false;
  };

  /* Mouse events */
  knob.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(e.clientX); });
  document.addEventListener('mousemove', (e) => onMove(e.clientX));
  document.addEventListener('mouseup', onEnd);

  /* Touch events */
  knob.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onStart(e.touches[0].clientX);
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    if (state.ribbonDragging) onMove(e.touches[0].clientX);
  }, { passive: true });

  document.addEventListener('touchend', onEnd, { passive: true });
}

function openGift() {
  if (state.giftOpened) return;
  state.giftOpened = true;

  Audio.play(DOM.audioSparkle());
  Particles.emit('giftOpen');

  /* Animate lid opening */
  const lid = DOM.giftLid();
  if (lid) lid.classList.add('open');

  /* Show reveal content */
  setTimeout(() => {
    const content = DOM.giftOpenContent();
    if (content) content.classList.remove('hidden');
    Audio.play(DOM.audioPop());
    Confetti.burst(document.getElementById('pages-container'), 30);
  }, 600);
}

/* ===== PAGE 12: COUNTDOWN ===== */
function startCountdown() {
  let count = 3;
  const numEl    = DOM.countdownNumber();
  const msgEl    = DOM.countdownMessage();
  const promptEl = DOM.countdownPrompt();

  const tick = () => {
    if (!numEl) return;

    numEl.classList.remove('animating');
    numEl.offsetHeight; /* reflow */
    numEl.classList.add('animating');
    numEl.textContent = count;

    Audio.play(DOM.audioPop());

    if (count <= 0) {
      /* Reveal the love message */
      setTimeout(() => {
        DOM.countdownDisplay()?.classList.add('hidden');
        msgEl?.classList.remove('hidden');
        promptEl?.classList.add('hidden');
        Audio.play(DOM.audioSparkle());
        Particles.emit('heartTap');
      }, 600);
      return;
    }

    count--;
    setTimeout(tick, 1100);
  };

  setTimeout(tick, 800);
}

/* ===== PAGE 15: ENDING ===== */
function spawnEndingHearts() {
  const container = DOM.endingHearts();
  if (!container) return;

  const heartEmojis = ['💖', '💗', '💕', '💓', '💝'];
  let count = 0;

  const spawnHeart = () => {
    if (count >= 30) return;
    count++;

    const h = document.createElement('span');
    h.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    h.style.position = 'absolute';
    h.style.left     = `${Math.random() * 90}%`;
    h.style.bottom   = `-30px`;
    h.style.fontSize = `${16 + Math.random() * 24}px`;
    h.style.opacity  = '0';
    h.style.animation = `particle-float ${1.5 + Math.random() * 2}s ease-out forwards`;
    h.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(h);
    h.addEventListener('animationend', () => h.remove(), { once: true });

    setTimeout(spawnHeart, 150 + Math.random() * 200);
  };

  spawnHeart();
}

function initEndingButtons() {
  const readAgain = DOM.btnReadAgain();
  const shareBtn  = DOM.btnShare();

  if (readAgain) {
    readAgain.addEventListener('click', restartBook);
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', shareStory);
  }
}

function restartBook() {
  /* Reset all state flags */
  state.isBookOpen         = false;
  state.heartTapCount      = 0;
  state.heartUnlocked      = false;
  state.envelopeOpened     = false;
  state.giftOpened         = false;
  state.countdownStarted   = false;
  state.page11ConfettiDone = false;
  state.page15Done         = false;
  state.ribbonCurrentX     = 0;

  /* Reset ribbon knob */
  const knob = DOM.ribbonKnob();
  if (knob) knob.style.left = '0px';

  /* Reset heart counter */
  const countEl = DOM.heartTapCount();
  if (countEl) countEl.textContent = '0 / 5';
  DOM.page5UnlockMsg()?.classList.add('hidden');
  DOM.heartPrompt()?.classList.remove('hidden');
  DOM.interactiveHeart()?.classList.add('bounce');

  /* Reset envelope */
  DOM.envelope()?.classList.remove('is-open');
  DOM.envelope()?.setAttribute('aria-expanded', 'false');
  DOM.letter()?.classList.add('hidden-letter');
  DOM.letter()?.classList.remove('letter-reveal');
  DOM.envelopePrompt()?.classList.remove('hidden');

  /* Reset gift */
  DOM.giftLid()?.classList.remove('open');
  DOM.giftOpenContent()?.classList.add('hidden');

  /* Reset countdown */
  const numEl = DOM.countdownNumber();
  if (numEl) numEl.textContent = '3';
  DOM.countdownMessage()?.classList.add('hidden');
  DOM.countdownDisplay()?.classList.remove('hidden');
  DOM.countdownPrompt()?.classList.remove('hidden');

  /* Hide all pages except page 1 */
  document.querySelectorAll('.page').forEach((p) => {
    p.classList.add('hidden-page');
    p.classList.remove('page-entering', 'page-leaving', 'page-entering-prev', 'page-leaving-next');
  });

  /* Close cover */
  const cover = DOM.frontCover();
  if (cover) {
    cover.classList.remove('is-open');
    cover.style.pointerEvents = '';
  }

  /* Go to start */
  state.currentPage = 1;
  state.isBookOpen  = false;
  updatePageIndicator();

  /* Re-open after short delay */
  setTimeout(() => {
    Particles.emit('bookOpen');
    openBook();
  }, 600);
}

async function shareStory() {
  const shareData = {
    title: 'A Little Love Story 💕',
    text: 'Baca cerita cinta interaktif yang imut dan penuh plot twist! 🌸',
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link berhasil disalin! Bagikan ke orang spesialmu 💕');
    }
  } catch (e) { /* User cancelled or not supported */ }
}

/* ===== GESTURE / TOUCH NAVIGATION ===== */
/* ===== GESTURE MOBILE ===== */
function initTouchNavigation() {
  const pagesContainer = DOM.pagesContainer();
  if (!pagesContainer) return;

  pagesContainer.addEventListener('touchstart', onTouchStart, { passive: true });
  pagesContainer.addEventListener('touchmove',  onTouchMove,  { passive: true });
  pagesContainer.addEventListener('touchend',   onTouchEnd,   { passive: true });
}

function onTouchStart(e) {
  state.touchStartX   = e.touches[0].clientX;
  state.touchStartY   = e.touches[0].clientY;
  state.touchCurrentX = e.touches[0].clientX;
}

function onTouchMove(e) {
  state.touchCurrentX = e.touches[0].clientX;
}

function onTouchEnd(e) {
  const deltaX = state.touchCurrentX - state.touchStartX;
  const deltaY = Math.abs(e.changedTouches[0].clientY - state.touchStartY);

  /* Only register horizontal swipes */
  if (Math.abs(deltaX) < CONFIG.swipeThreshold || deltaY > Math.abs(deltaX)) return;

  if (deltaX < -CONFIG.swipeThreshold) {
    nextPage(); /* Swipe left → next */
  } else if (deltaX > CONFIG.swipeThreshold) {
    prevPage(); /* Swipe right → prev */
  }
}

/* ===== TAP ZONE NAVIGATION ===== */
function initTapNavigation() {
  const navPrev = DOM.navPrev();
  const navNext = DOM.navNext();

  if (navPrev) {
    navPrev.addEventListener('click', (e) => {
      if (!state.isBookOpen) return;
      e.stopPropagation();
      prevPage();
    });
    navPrev.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && state.isBookOpen) prevPage();
    });
  }

  if (navNext) {
    navNext.addEventListener('click', (e) => {
      if (!state.isBookOpen) return;
      e.stopPropagation();
      nextPage();
    });
    navNext.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && state.isBookOpen) nextPage();
    });
  }
}

/* ===== KEYBOARD NAVIGATION ===== */
function initKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (!state.isBookOpen) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevPage();
  });
}

/* ===== MUTE BUTTON ===== */
function initMuteButton() {
  const btn = DOM.muteBtn();
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    Audio.toggleMute();
  });
}

/* ===== RANDOM EMOJI SPAWNER ===== */
function initRandomEmojis() {
  /* Only spawn when app is visible */
  setInterval(() => {
    if (!state.isBookOpen) return;
    spawnRandomEmoji();
  }, CONFIG.emojiPopInterval);
}

/* ===== BLINK ANIMATION FOR CHIBI EYES ===== */
function initChibiBlinking() {
  /* The blink animation is purely CSS-driven via the .blink-eye class.
     Nothing needed in JS unless we want a random trigger. */
}

/* ===== PERFORMANCE: will-change hints ===== */
function applyWillChange() {
  /* Applied in CSS where needed; here we set dynamic ones */
  DOM.frontCover()?.style.setProperty('will-change', 'transform');
  document.querySelectorAll('.page').forEach(p => {
    p.style.setProperty('will-change', 'transform, opacity');
  });
}

/* ===== PAGE INDICATOR VISIBILITY ===== */
function updateUIVisibility() {
  const indicator = DOM.pageIndicator();
  const muteBtn   = DOM.muteBtn();
  if (!indicator || !muteBtn) return;

  if (state.isBookOpen) {
    indicator.style.opacity = '1';
    muteBtn.style.opacity   = '1';
  }
}

/* ===== INIT ===== */
/* ===== MAIN INIT ===== */
function init() {
  /* Kick off visual systems */
  Petals.init();
  initOpeningScene();
  initBookCover();

  /* Page-specific interactions */
  initHeartInteraction();
  initEnvelope();
  initEndingButtons();

  /* Navigation */
  initTouchNavigation();
  initTapNavigation();
  initKeyboardNavigation();

  /* UI controls */
  initMuteButton();

  /* Ambience */
  initRandomEmojis();
  initChibiBlinking();

  /* Performance */
  applyWillChange();

  /* Set page indicator total */
  const tot = DOM.totalPagesNum();
  if (tot) tot.textContent = CONFIG.totalPages;

  /* Hide the page indicator & mute until book is open */
  DOM.pageIndicator()?.style.setProperty('opacity', '0');
  DOM.muteBtn()?.style.setProperty('opacity', '0');

  /* Reveal UI after book opens */
  const origOpenBook = openBook;
  window._openBook = () => {
    origOpenBook();
    setTimeout(() => {
      DOM.pageIndicator()?.style.setProperty('opacity', '1');
      DOM.muteBtn()?.style.setProperty('opacity', '1');
    }, 500);
  };

  console.log('%c💖 A Little Love Story loaded! 💖', 'color: #FF6B9D; font-size: 16px; font-weight: bold;');
}

/* ===== WAIT FOR DOM ===== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ==========================================================
   HOW TO CUSTOMISE THE STORY
   ===========================================================

   1. CHANGE PAGE CONTENT:
      Edit the corresponding <div class="page" data-page="N"> in index.html.

   2. ADD A NEW PAGE (e.g., page 16):
      a. In index.html, duplicate an existing .page div.
      b. Change data-page="15" → data-page="16" on the new div.
      c. Add class "hidden-page" to it.
      d. In script.js, update CONFIG.totalPages from 15 → 16.
      e. If the page needs special logic, add a case to onPageEnter().
      f. Done! Navigation, particles, and the indicator all update automatically.

   3. CHANGE COLOURS:
      Edit CSS custom properties in the :root block at the top of style.css.

   4. CHANGE THE BOOK TITLE:
      Search for "A Little Love Story" in index.html and replace it.

   5. CHANGE LOVE MESSAGE:
      Edit the .love-line elements inside page 14 in index.html.

   6. ADD AUDIO FILES:
      Place your .mp3 files in ./assets/audio/ with these exact names:
        bgm.mp3, book-open.mp3, page-flip.mp3, pop.mp3, sparkle.mp3

   7. DEPLOY TO GITHUB PAGES:
      a. Create a GitHub repository.
      b. Upload all files maintaining the folder structure.
      c. Go to Settings → Pages → Source: Deploy from branch → main / root.
      d. Visit: https://yourusername.github.io/your-repo/

   ========================================================== */
