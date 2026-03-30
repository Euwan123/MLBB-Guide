import { CHAPTER_ORDER, CHAPTER_META } from '../config/supabase.js';

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

let currentPage = 'home';
let completedChapters = new Set();

export function navigateToPage(pageId) {
  const oldPage = $(`page-${currentPage}`);
  if (oldPage) oldPage.classList.remove('active');

  currentPage = pageId;
  const newPage = $(`page-${pageId}`);
  if (newPage) newPage.classList.add('active');

  if (pageId === 'home') {
    $('navBack').classList.remove('show');
    $('navChapter').textContent = '';
    $('navProgress').style.display = 'none';
  } else {
    $('navBack').classList.add('show');
    const meta = CHAPTER_META[pageId];
    if (meta) {
      $('navChapter').textContent = `Chapter ${meta.n} — ${meta.t}`;
    }
    $('navProgress').style.display = 'block';
    updateProgressBar(pageId);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function navigateHome() {
  navigateToPage('home');
}

function updateProgressBar(pageId) {
  const idx = CHAPTER_ORDER.indexOf(pageId);
  const pct = idx >= 0 ? Math.round(((idx + 1) / CHAPTER_ORDER.length) * 100) : 0;
  $('navProgressBar').style.width = pct + '%';
}

export function notify(message, type = 'success', duration = 3000) {
  const notif = $('notification');
  notif.textContent = message;
  notif.className = `notification ${type}`;
  notif.style.display = 'block';

  if (duration > 0) {
    setTimeout(() => {
      notif.style.animation = 'slideUp .3s ease-out forwards';
      setTimeout(() => {
        notif.style.display = 'none';
        notif.style.animation = '';
      }, 300);
    }, duration);
  }
}

export function openAuthModal() {
  const modal = $('authModal');
  if (modal) modal.classList.add('open');
  switchAuthTab('login');
  const loginName = $('loginName');
  if (loginName) loginName.focus();
}

export function closeAuthModal() {
  const modal = $('authModal');
  if (modal) modal.classList.remove('open');
}

export function switchAuthTab(tabName) {
  const formLogin = $('formLogin');
  const formSignup = $('formSignup');
  const tabLogin = $('tabLogin');
  const tabSignup = $('tabSignup');

  if (!formLogin || !formSignup) return;

  formLogin.style.display = tabName === 'login' ? 'flex' : 'none';
  formSignup.style.display = tabName === 'signup' ? 'flex' : 'none';

  if (tabLogin) tabLogin.classList.toggle('active', tabName === 'login');
  if (tabSignup) tabSignup.classList.toggle('active', tabName === 'signup');
}

export function openTermsModal() {
  const modal = $('termsModal');
  if (modal) modal.classList.add('open');
}

export function closeTermsModal() {
  const modal = $('termsModal');
  if (modal) modal.classList.remove('open');
}

export function openProfileModal() {
  const modal = $('profileModal');
  if (modal) modal.classList.add('open');
}

export function closeProfileModal() {
  const modal = $('profileModal');
  if (modal) modal.classList.remove('open');
}

export function updateAuthUI(session) {
  const authArea = $('navAuthArea');
  const menuAuth = $('navMenuAuth');
  authArea.innerHTML = '';
  if (menuAuth) menuAuth.innerHTML = '';

  if (session) {
    const username = session.user.user_metadata?.username || 'User';
    const initial = (username || '').substring(0, 1).toUpperCase();

    authArea.innerHTML = `
      <div class="nav-user" onclick="window.app.openProfile()" style="cursor:pointer;">
        <div class="nav-avatar">${initial}</div>
        <span>${username}</span>
      </div>
      <button class="nav-auth-btn logout" onclick="window.app.logout()">Logout</button>
    `;

    if (menuAuth) {
      menuAuth.innerHTML = `
        <button class="nav-menu-btn" onclick="window.app.openProfile()">👤 Profile</button>
        <button class="nav-menu-btn" onclick="window.app.logout()">🚪 Logout</button>
      `;
    }
  } else {
    authArea.innerHTML = `
      <button class="nav-auth-btn login" onclick="window.app.openAuth()">Login</button>
      <button class="nav-auth-btn login" style="background:rgba(255,215,0,.2);color:var(--gold);" onclick="window.app.openAuth()">Sign Up</button>
    `;

    if (menuAuth) {
      menuAuth.innerHTML = `
        <button class="nav-menu-btn" onclick="window.app.openAuth()">🔐 Login / Sign Up</button>
      `;
    }
  }
}

export function updateCompletedBadges() {
  $$('.chapter-btn').forEach((btn) => {
    const ch = btn.dataset.chapter;
    if (completedChapters.has(ch)) {
      btn.classList.add('done');
    } else {
      btn.classList.remove('done');
    }
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

export function getNavbarHTML() {
  return `
    <nav>
      <div class="nav-brand" id="navBrand" onclick="window.nav.goHome()" style="cursor:pointer;">⚔ Mr. Yoo's MLBB Guide</div>
      <div class="nav-back" id="navBack" onclick="window.nav.goHome()">← All Chapters</div>
      <span class="nav-chapter" id="navChapter"></span>
      <div class="nav-menu" id="navMenu">
        <button class="nav-menu-btn" onclick="window.app.openDiagnostic()">📊 Diagnostic</button>
        <button class="nav-menu-btn" onclick="window.app.openGuide()">📖 Book Guide</button>
        <button class="nav-menu-btn" onclick="window.app.openContact()">📧 Contact</button>
      </div>
      <button class="nav-burger" id="navBurger" onclick="window.app.toggleMenu()">☰</button>
      <div class="nav-right">
        <div id="navProgress" class="nav-progress" style="display:none;"><div class="nav-progress-bar" id="navProgressBar" style="width:0%"></div></div>
        <div id="navAuthArea"></div>
      </div>
    </nav>
  `;
}

export function injectNavbar(containerId) {
  const container = $(containerId);
  if (container) {
    container.innerHTML = getNavbarHTML() + container.innerHTML;
  }
}

function closeMenuIfOpen() {
  const menu = $('navMenu');
  if (menu) menu.classList.remove('open');
}

export function openDiagnostic() {
  closeMenuIfOpen();
  navigateToPage('dark-system');
}

export function openGuide() {
  closeMenuIfOpen();
  navigateToPage('introduction');
}

export function openContact() {
  closeMenuIfOpen();
  window.location.href = 'mailto:mryoo.guide@gmail.com';
}