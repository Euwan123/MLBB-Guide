import { CHAPTER_ORDER, CHAPTER_META } from '../config/supabase.js';

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

let currentPage = 'home';
let completedChapters = new Set();

export function navigateToPage(pageId) {
  try {
    const oldPage = $(`page-${currentPage}`);
    if (oldPage) {
      oldPage.classList.remove('active');
      oldPage.style.display = 'none';
    }
    currentPage = pageId;
    const newPage = $(`page-${pageId}`);
    if (!newPage) {
      return;
    }
    newPage.style.display = 'block';
    newPage.classList.add('active');

    if (pageId === 'home') {
      const nb = $('navBack'); if (nb) nb.classList.remove('show');
      const nc = $('navChapter'); if (nc) nc.textContent = '';
      const np = $('navProgress'); if (np) np.style.display = 'none';
    } else {
      const nb = $('navBack'); if (nb) nb.classList.add('show');
      const meta = CHAPTER_META[pageId];
      const nc = $('navChapter'); if (nc && meta) nc.textContent = `${meta.n} — ${meta.t}`;
      const np = $('navProgress'); if (np) np.style.display = 'block';
      updateProgressBar(pageId);
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
  } catch (e) {
  }
}

export function navigateHome() { navigateToPage('home'); }

function updateProgressBar(pageId) {
  const idx = CHAPTER_ORDER.indexOf(pageId);
  const pct = idx >= 0 ? Math.round(((idx + 1) / CHAPTER_ORDER.length) * 100) : 0;
  const bar = $('navProgressBar'); if (bar) bar.style.width = pct + '%';
}

export function notify(message, type = 'success', duration = 3000) {
  const notif = $('notification');
  if (!notif) return;
  notif.textContent = message;
  notif.className = `notification ${type}`;
  notif.style.display = 'block';
  if (duration > 0) {
    setTimeout(() => {
      notif.style.animation = 'slideUp .3s ease-out forwards';
      setTimeout(() => { notif.style.display = 'none'; notif.style.animation = ''; }, 300);
    }, duration);
  }
}

export function openAuthModal() {
  const modal = $('authModal');
  if (modal) { modal.classList.add('open'); }
  switchAuthTab('login');
  setTimeout(() => { const el = $('loginName'); if (el) el.focus(); }, 100);
}

export function closeAuthModal() {
  const modal = $('authModal');
  if (modal) modal.classList.remove('open');
}

export function switchAuthTab(tabName) {
  const fl = $('formLogin'), fs = $('formSignup');
  const tl = $('tabLogin'), ts = $('tabSignup');
  if (!fl || !fs) return;
  fl.style.display = tabName === 'login' ? 'flex' : 'none';
  fs.style.display = tabName === 'signup' ? 'flex' : 'none';
  if (tl) tl.classList.toggle('active', tabName === 'login');
  if (ts) ts.classList.toggle('active', tabName === 'signup');
}

export function openTermsModal() { const m = $('termsModal'); if (m) m.classList.add('open'); }
export function closeTermsModal() { const m = $('termsModal'); if (m) m.classList.remove('open'); }
export function openProfileModal() { const m = $('profileModal'); if (m) m.classList.add('open'); }
export function closeProfileModal() { const m = $('profileModal'); if (m) m.classList.remove('open'); }

export function updateAuthUI(session) {
  const authArea = $('navAuthArea');
  const menuAuth = $('navMenuAuth');
  const signInBtn = $('navSignIn');
  
  if (authArea) authArea.innerHTML = '';
  if (menuAuth) menuAuth.innerHTML = '';
  
  if (session) {
    const username = session.user.user_metadata?.username || 'User';
    const initial = (username || 'U').substring(0, 1).toUpperCase();
    if (authArea) authArea.innerHTML = `
      <div class="nav-user" onclick="window.app.openProfile()" style="cursor:pointer;">
        <div class="nav-avatar">${initial}</div>
        <span>${username}</span>
      </div>
      <button class="nav-auth-btn logout" onclick="window.app.logout()">Logout</button>`;
    if (menuAuth) menuAuth.innerHTML = `
      <button class="nav-menu-btn" onclick="window.app.openProfile()">Profile</button>
      <button class="nav-menu-btn" onclick="window.app.logout()">Logout</button>`;
    if (signInBtn) {
      signInBtn.classList.add('hidden');
      signInBtn.style.display = 'none';
    }
    if (document.body) document.body.classList.add('user-logged-in');
  } else {
    if (authArea) authArea.innerHTML = `
      <button class="nav-auth-btn login" onclick="window.app.openAuth()">Login</button>
      <button class="nav-auth-btn signup" onclick="window.app.openAuth(); window.app.switchTab('signup')">Sign Up</button>`;
    if (menuAuth) menuAuth.innerHTML = `
      <button class="nav-menu-btn" onclick="window.app.openAuth()">Login / Sign Up</button>`;
    if (signInBtn) {
      signInBtn.classList.remove('hidden');
      signInBtn.style.display = '';
    }
    if (document.body) document.body.classList.remove('user-logged-in');
  }
}

export function updateCompletedBadges() {
  $$('.chapter-btn').forEach((btn) => {
    const ch = btn.dataset.chapter;
    if (ch) btn.classList.toggle('done', completedChapters.has(ch));
  });
}

export function markChapterDone(chapter) {
  completedChapters.add(chapter);
  updateCompletedBadges();
}

export function loadCompletedChapters(chapters) {
  completedChapters.clear();
  chapters.forEach((ch) => completedChapters.add(ch));
  updateCompletedBadges();
}

export function toggleMenu() {
  const menu = $('navMenu');
  if (menu) menu.classList.toggle('open');
}

function closeMenuIfOpen() {
  const menu = $('navMenu');
  if (menu) menu.classList.remove('open');
}

export function openDiagnostic() { closeMenuIfOpen(); navigateToPage('dark-system'); }
export function openGuide() { closeMenuIfOpen(); navigateToPage('introduction'); }
export function openContact() { closeMenuIfOpen(); const m = $('contactModal'); if (m) m.classList.add('open'); }