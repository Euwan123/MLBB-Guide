import { sb, CHAPTER_ORDER, CHAPTER_META } from '../config/supabase.js';
import * as api from './api.js';
import * as ui from './ui.js';
import * as logic from './logic.js';

let session = null;
let deferredPrompt = null;
let reactionState = null;
let quizState = null;

const $ = (id) => document.getElementById(id);

const doLogin = async () => {
  const nm = $('loginName')?.value.trim();
  const pw = $('loginPass')?.value.trim();
  const err = $('loginErr');
  const btn = $('loginBtn');

  if (!nm || !pw) { if (err) err.textContent = 'Username and password required'; return; }
  if (nm.length < 3) { if (err) err.textContent = 'Username must be at least 3 characters'; return; }

  if (btn) btn.disabled = true;
  if (err) err.textContent = '';

  try {
    session = await api.loginWithCredentials(nm, pw);
    ui.closeAuthModal();
    ui.updateAuthUI(session);
    await loadProgressForSession();
    ui.notify(`Welcome back, ${nm}!`, 'success', 2500);
  } catch (e) {
    if (err) err.textContent = e.message || 'Login failed';
    ui.notify(e.message || 'Login failed', 'error', 3000);
  } finally {
    if (btn) btn.disabled = false;
  }
};

const doSignup = async () => {
  const nm = $('signupName')?.value.trim();
  const pw = $('signupPass')?.value.trim();
  const err = $('signupErr');
  const btn = $('signupBtn');

  if (!nm || !pw) { if (err) err.textContent = 'Username and password required'; return; }
  if (nm.length < 3) { if (err) err.textContent = 'Username must be at least 3 characters'; return; }
  if (nm.length > 20) { if (err) err.textContent = 'Username must be 20 characters or less'; return; }
  if (!/^[a-zA-Z0-9_]+$/.test(nm)) { if (err) err.textContent = 'Letters, numbers, underscores only'; return; }
  if (pw.length < 8) { if (err) err.textContent = 'Password must be at least 8 characters'; return; }

  if (btn) btn.disabled = true;
  if (err) err.textContent = '';

  try {
    const newSession = await api.signupWithCredentials(nm, pw);
    if (newSession) {
      session = newSession;
      ui.closeAuthModal();
      ui.updateAuthUI(session);
      await loadProgressForSession();
      ui.notify(`Welcome, ${nm}!`, 'success', 2500);
    } else {
      if (err) err.textContent = 'Account created! You can now log in.';
      setTimeout(() => ui.switchAuthTab('login'), 1500);
    }
  } catch (e) {
    const msg = e.message?.includes('already registered') ? 'This username is already taken' : (e.message || 'Signup failed');
    if (err) err.textContent = msg;
  } finally {
    if (btn) btn.disabled = false;
  }
};

const logout = async () => {
  try { await api.signOut(); } catch {}
  session = null;
  ui.loadCompletedChapters([]);
  ui.updateAuthUI(null);
  ui.navigateHome();
  ui.notify('Logged out', 'success', 2000);
};

const openProfile = () => {
  if (!session) { ui.openAuthModal(); return; }
  ui.openProfileModal();
  loadProfile();
};

const loadProfile = async () => {
  if (!session) return;
  try {
    const profile = await api.loadUserProfile(session.user.id);
    if (profile) {
      const fields = {
        profileName: profile.username,
        profileBio: profile.bio,
        profileRank: profile.rank,
        profileWinRate: profile.win_rate,
        profileRole: profile.main_role,
        profileHeroes: profile.main_heroes?.join(', '),
        profileMatches: profile.total_matches,
        profileServer: profile.server_region,
        profileSocial: profile.social_media
      };
      for (const [id, value] of Object.entries(fields)) {
        const el = $(id);
        if (el) el.value = value || '';
      }
      const img = $('profileImagePreview');
      if (img && profile.profile_image_url) {
        img.src = profile.profile_image_url;
        img.style.display = 'block';
      }
    }
  } catch (e) {}
};

const updateProfile = async () => {
  if (!session) return;
  try {
    const imageFile = $('profileImageInput')?.files?.[0];
    let profileImageUrl = null;
    if (imageFile) profileImageUrl = await api.uploadProfileImage(session.user.id, imageFile);
    const username = session.user.user_metadata?.username || 'User';
    const profileData = {
      username: username,
      bio: $('profileBio')?.value || null,
      rank: $('profileRank')?.value || null,
      winRate: $('profileWinRate')?.value || null,
      mainRole: $('profileRole')?.value || null,
      mainHeroes: $('profileHeroes')?.value || null,
      totalMatches: $('profileMatches')?.value || null,
      serverRegion: $('profileServer')?.value || null,
      socialMedia: $('profileSocial')?.value || null,
      profileImageUrl: profileImageUrl
    };
    await api.saveUserProfile(session.user.id, profileData);
    ui.closeProfileModal();
    ui.notify('Profile updated!', 'success', 2000);
  } catch (e) {
    ui.notify('Profile update failed: ' + (e.message || 'Unknown error'), 'error', 3000);
  }
};

const loadProgressForSession = async () => {
  if (!session) return;
  try {
    const chapters = await api.loadChapterProgress(session.user.id);
    ui.loadCompletedChapters(chapters);
  } catch {}
};

const markChapterCompleted = async (chapter) => {
  if (!session) return;
  try { await api.saveChapterProgress(session.user.id, chapter); ui.markChapterDone(chapter); } catch {}
};

const ensureReactionGame = () => {
  const box = $('rcBox');
  if (!box || reactionState) return;
  const stats = $('rcStats');
  const avgEl = $('rcAvg');
  const bestEl = $('rcBest');
  const roundEl = $('rcRound');
  const verdict = $('rcVerdict');
  reactionState = { running: false, armed: false, goAt: 0, round: 0, times: [], timer: null, box, stats, avgEl, bestEl, roundEl, verdict };

  const render = () => {
    if (!reactionState) return;
    const { times, stats, roundEl, avgEl, bestEl, verdict, round } = reactionState;
    if (stats) stats.style.display = times.length ? 'block' : 'none';
    if (roundEl) roundEl.textContent = String(round);
    if (!times.length) return;
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / times.length);
    const best = Math.round(Math.min(...times));
    if (avgEl) avgEl.textContent = String(avg);
    if (bestEl) bestEl.textContent = String(best);
    const score = Math.max(0, Math.min(1, (320 - avg) / 170));
    const pct = Math.round(score * 99);
    if (verdict) verdict.textContent = `Consistency score: ${pct}/99. Focus on clean clicks, not panic.`;
  };

  const setIdle = () => {
    if (!reactionState) return;
    reactionState.armed = false;
    reactionState.running = false;
    if (reactionState.timer) {
      clearTimeout(reactionState.timer);
      reactionState.timer = null;
    }
    if (reactionState.box) {
      reactionState.box.style.background = 'rgba(255,255,255,.04)';
      reactionState.box.style.borderColor = 'rgba(255,149,0,.22)';
      reactionState.box.style.color = 'var(--dim)';
      reactionState.box.textContent = 'Press Start';
    }
    render();
  };

  window.rcReset = () => {
    if (!reactionState) return;
    reactionState.times = [];
    reactionState.round = 0;
    setIdle();
  };

  window.rcStart = () => {
    if (!reactionState || reactionState.running) return;
    reactionState.running = true;
    reactionState.armed = false;
    if (reactionState.box) {
      reactionState.box.style.background = 'rgba(255,255,255,.04)';
      reactionState.box.style.borderColor = 'rgba(255,149,0,.22)';
      reactionState.box.style.color = '#cfe6ff';
      reactionState.box.textContent = 'Wait...';
    }
    const delay = 650 + Math.random() * 1800;
    reactionState.timer = setTimeout(() => {
      if (!reactionState) return;
      reactionState.armed = true;
      reactionState.goAt = performance.now();
      if (reactionState.box) {
        reactionState.box.style.background = 'linear-gradient(135deg,#ff8800,#ffd700)';
        reactionState.box.style.borderColor = 'rgba(255,215,0,.45)';
        reactionState.box.style.color = 'rgba(7,17,31,.95)';
        reactionState.box.textContent = 'CLICK';
      }
    }, delay);
  };

  box.addEventListener('click', () => {
    if (!reactionState || !reactionState.running) return;
    if (!reactionState.armed) {
      if (reactionState.timer) {
        clearTimeout(reactionState.timer);
        reactionState.timer = null;
      }
      reactionState.running = false;
      reactionState.box.style.background = 'rgba(220,38,38,.12)';
      reactionState.box.style.borderColor = 'rgba(220,38,38,.35)';
      reactionState.box.style.color = '#fca5a5';
      reactionState.box.textContent = 'Too early. Press Start.';
      return;
    }
    reactionState.armed = false;
    reactionState.running = false;
    const t = performance.now() - reactionState.goAt;
    reactionState.times.push(t);
    reactionState.round = Math.min(5, reactionState.round + 1);
    reactionState.box.style.background = 'rgba(34,197,94,.12)';
    reactionState.box.style.borderColor = 'rgba(34,197,94,.35)';
    reactionState.box.style.color = '#bbf7d0';
    reactionState.box.textContent = `${Math.round(t)} ms`;
    render();
  });

  setIdle();
};

const defaultQuizQuestions = [
  {
    question: 'You are marksman. Enemy has high burst and one assassin diving you every fight. Best item direction?',
    options: ['Wind of Nature or defensive timing item', 'Pure damage second item', 'Anti-heal first no matter what'],
    correctIndex: 0,
    explanation: 'You need to survive first so your DPS can stay active.',
  },
  {
    question: 'Enemy has heavy sustain in long fights. Which item theme is highest priority?',
    options: ['Anti-heal items', 'Only penetration stack', 'Crit greed scaling'],
    correctIndex: 0,
    explanation: 'Anti-heal increases effective damage for the whole team.',
  },
  {
    question: 'Enemy front line is tanky and fights are front-to-back. Most consistent approach?',
    options: ['Sustained DPS with pen/on-hit', 'All-in burst build', 'Always dive backline'],
    correctIndex: 0,
    explanation: 'Sustained damage wins extended tank fights.',
  },
];

const ensureItemizationQuiz = async () => {
  const qEl = $('iqQ');
  const dEl = $('iqD');
  const aEl = $('iqA');
  const scoreBox = $('iqScoreBox');
  const scoreLine = $('iqScoreLine');
  const tipEl = $('iqTip');
  if (!qEl || !dEl || !aEl || quizState) return;

  const remoteQuestions = await api.loadQuizQuestions('itemization');
  const questions = remoteQuestions.length
    ? remoteQuestions.map((q) => ({ question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation }))
    : defaultQuizQuestions;

  quizState = { idx: 0, score: 0, answered: false, startAt: Date.now(), questions };
  let leaderboardTimer = null;

  const render = () => {
    if (!quizState) return;
    const q = quizState.questions[quizState.idx];
    quizState.answered = false;
    qEl.textContent = `Q${quizState.idx + 1}: ${q.question}`;
    dEl.textContent = 'Choose the best item direction.';
    aEl.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-button';
      btn.style.width = '100%';
      btn.style.textAlign = 'left';
      btn.textContent = `${String.fromCharCode(65 + i)}) ${opt}`;
      btn.addEventListener('click', async () => {
        if (!quizState || quizState.answered) return;
        quizState.answered = true;
        const ok = i === q.correctIndex;
        if (ok) quizState.score += 1;
        if (scoreBox) scoreBox.style.display = 'block';
        if (scoreLine) scoreLine.textContent = `Current: ${quizState.score}/${quizState.questions.length}`;
        if (tipEl) tipEl.textContent = q.explanation || '';
        btn.style.borderColor = ok ? 'rgba(34,197,94,.45)' : 'rgba(220,38,38,.45)';
        btn.style.background = ok ? 'rgba(34,197,94,.08)' : 'rgba(220,38,38,.08)';
      });
      aEl.appendChild(btn);
    });
  };

  window.iqReset = () => {
    if (!quizState) return;
    quizState.idx = 0;
    quizState.score = 0;
    quizState.startAt = Date.now();
    if (scoreBox) scoreBox.style.display = 'none';
    if (leaderboardTimer) {
      clearInterval(leaderboardTimer);
      leaderboardTimer = null;
    }
    render();
  };

  window.iqNext = async () => {
    if (!quizState) return;
    if (quizState.idx < quizState.questions.length - 1) {
      quizState.idx += 1;
      render();
      return;
    }
    const elapsedMs = Date.now() - quizState.startAt;
    if (scoreBox) scoreBox.style.display = 'block';
    if (scoreLine) scoreLine.textContent = `Final: ${quizState.score}/${quizState.questions.length}`;
    if (tipEl) tipEl.textContent = 'Best builds solve the biggest problem first, then scale damage.';
    if (session?.user?.id) {
      try { await api.saveQuizResult(session.user.id, 'itemization', quizState.score, quizState.questions.length, elapsedMs); } catch {}
      try {
        const refreshLeaderboard = async () => {
          const rows = await api.loadQuizLeaderboard('itemization', 10);
          const leaderboard = rows.map((r, idx) => `${idx + 1}. ${r.score}/${r.total_questions} - ${Math.round((r.elapsed_ms || 0) / 1000)}s`).join(' | ');
          if (tipEl && leaderboard) tipEl.textContent = `Live leaderboard: ${leaderboard}`;
        };
        await refreshLeaderboard();
        if (leaderboardTimer) clearInterval(leaderboardTimer);
        leaderboardTimer = setInterval(refreshLeaderboard, 5000);
      } catch {}
    }
  };

  render();
};

const calculateDarkSystem = () => {
  try {
    const matches = parseInt($('dsMatches')?.value) || 0;
    const wr = parseFloat($('dsWinrate')?.value) || 0;
    const mvps = parseInt($('dsMvp')?.value) || 0;
    const resultBox = $('dsResult');
    if (!resultBox) return;
    if (matches === 0) { resultBox.style.display = 'none'; return; }

    const result = logic.analyzeDarkSystem(matches, wr, mvps);
    if (!result) { resultBox.style.display = 'none'; return; }

    resultBox.className = `result-box-dark ${result.classificationClass}`;
    resultBox.innerHTML = `
      <div class="result-title">${result.classification}</div>
      <div class="result-stats">
        <div class="stat"><span class="label">Win Rate</span><span class="value">${result.currentWR.toFixed(1)}%</span><span class="verdict ${result.wrPasses ? 'pass' : 'fail'}">${result.wrPasses ? '✓ Good' : '✗ Low'}</span></div>
        <div class="stat"><span class="label">Expected WR</span><span class="value">${result.expectedWR}%+</span><span class="verdict"></span></div>
        <div class="stat"><span class="label">MVP Count</span><span class="value">${result.currentMVP}</span><span class="verdict ${result.mvpPasses ? 'pass' : 'fail'}">${result.mvpPasses ? '✓ Good' : '✗ Low'}</span></div>
        <div class="stat"><span class="label">Expected MVPs</span><span class="value">${result.expectedMVP}+</span><span class="verdict"></span></div>
      </div>`;
    resultBox.style.display = 'block';
  } catch (e) {
    ui.notify('Check your inputs and try again.', 'error', 3000);
  }
};

const initChapters = async () => {
  const baseURL = window.location.pathname.includes('/mlbb-guide') ? '/mlbb-guide' : '';
  const container = $('chapters-container');
  if (!container) {
    return;
  }
  if (container.children.length > 0) {
    setupEventListeners();
    return;
  }
  
  let loadedCount = 0;
  for (const ch of CHAPTER_ORDER) {
    try {
      const url = `${baseURL}/html/${ch}.html`;
      const resp = await fetch(url);
      if (!resp.ok) {
        continue;
      }
      const html = await resp.text();
      const el = document.createElement('div');
      el.innerHTML = html;
      el.id = `page-${ch}`;
      el.className = 'page';
      container.appendChild(el);
      loadedCount++;
    } catch (e) {
    }
  }
  setupEventListeners();
};

const setupEventListeners = () => {
  try {
    const loginBtn = $('loginBtn');
    const signupBtn = $('signupBtn');
    if (loginBtn) loginBtn.addEventListener('click', doLogin);
    if (signupBtn) signupBtn.addEventListener('click', doSignup);

    const loginPass = $('loginPass');
    if (loginPass) loginPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
    const signupPass = $('signupPass');
    if (signupPass) signupPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSignup(); });

    const chapterBtns = document.querySelectorAll('[data-chapter]');
    
    chapterBtns.forEach((btn) => {
      const ch = btn.dataset.chapter;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ch) {
          const pageId = ch;
          const page = $(`page-${pageId}`);
          ui.navigateToPage(pageId);
          markChapterCompleted(ch);
        }
      });
    });

    ui.updateCompletedBadges();
  } catch (e) {
  }
};

const initPWAInstall = () => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = $('pwaInstallBtn');
    if (installBtn) { installBtn.style.display = 'block'; installBtn.addEventListener('click', installPWA); }
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const installBtn = $('pwaInstallBtn');
    if (installBtn) installBtn.style.display = 'none';
    ui.notify('App installed!', 'success', 3000);
  });
};

const installPWA = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') ui.notify('Installing...', 'success', 2000);
  deferredPrompt = null;
};

const init = async () => {
  try {
    try {
      const { error } = await Promise.race([
        sb.from('chapter_progress').select('chapter').limit(1),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
      ]);
      if (error) ui.notify('Could not connect to database. Working offline.', 'warning', 4000);
    } catch (e) {
      ui.notify('Database connection failed. Using local storage.', 'warning', 3000);
    }
    session = await api.getSession();
    ui.updateAuthUI(session);
    if (session) await loadProgressForSession();
    api.onAuthStateChange((event, newSession) => {
      session = newSession;
      ui.updateAuthUI(newSession);
      if (newSession) loadProgressForSession();
      else ui.loadCompletedChapters([]);
    });
    initPWAInstall();
    if (!(window.NAV && typeof window.NAV.goTo === 'function')) {
      await initChapters();
    }
    let tries = 0;
    const attachWidgets = async () => {
      ensureReactionGame();
      await ensureItemizationQuiz();
      tries += 1;
      if ((!window.rcStart || !window.iqReset) && tries < 20) {
        setTimeout(attachWidgets, 300);
      }
    };
    attachWidgets();
    setTimeout(() => {
      setupEventListeners();
    }, 200);
  } catch (e) {
    setTimeout(() => {
      setupEventListeners();
      let tries = 0;
      const attachWidgets = async () => {
        ensureReactionGame();
        await ensureItemizationQuiz();
        tries += 1;
        if ((!window.rcStart || !window.iqReset) && tries < 20) {
          setTimeout(attachWidgets, 300);
        }
      };
      attachWidgets();
    }, 500);
  }
};

window._saveProgress = (ch) => markChapterCompleted(ch);
window._doLogin = doLogin;
window._doSignup = doSignup;
window._logout = logout;
window._saveProfile = updateProfile;

window.app = {
  navigateToPage: ui.navigateToPage,
  navigateHome: ui.navigateHome,
  openAuth: ui.openAuthModal,
  closeAuth: ui.closeAuthModal,
  doLogin,
  doSignup,
  logout,
  openProfile,
  closeProfile: ui.closeProfileModal,
  loadProfile,
  updateProfile,
  toggleMenu: ui.toggleMenu,
  openDiagnostic: ui.openDiagnostic,
  openGuide: ui.openGuide,
  openContact: ui.openContact,
  notify: ui.notify,
  switchTab: ui.switchAuthTab,
  openTerms: ui.openTermsModal,
  closeTerms: ui.closeTermsModal,
  calculateDarkSystem,
  installPWA,
};

window.nav = {
  goHome: ui.navigateHome,
  goTo: ui.navigateToPage,
};

if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      });
      images.forEach(img => imageObserver.observe(img));
    }
  });
}

if ('connection' in navigator) {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection && (connection.effectiveType === '4g' || connection.effectiveType === '3g')) {
    document.body.classList.add('slow-connection');
  }
}

document.addEventListener('DOMContentLoaded', init);