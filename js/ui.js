/**
 * UI.JS - User Interface & DOM Management
 * Handles all DOM rendering, page navigation, modals, notifications
 * Separates presentation logic from data and business logic
 */

import { CHAPTER_ORDER, CHAPTER_META } from '../config/supabase.js';

// DOM Shortcuts
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/**
 * NAVIGATION & PAGE ROUTING
 */

let currentPage = 'home';
let completedChapters = new Set();

/**
 * Navigate to a page/chapter with smooth scroll animation
 */
export function navigateToPage(pageId) {
  const oldPage = $(`page-${currentPage}`);
  if (oldPage) oldPage.classList.remove('active');

  currentPage = pageId;
  const newPage = $(`page-${pageId}`);
  if (newPage) newPage.classList.add('active');

  // Update nav UI
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

  // Smooth scroll to top with animation (300ms)
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Navigate home
 */
export function navigateHome() {
  navigateToPage('home');
}

/**
 * Update progress bar
 * @private
 */
function updateProgressBar(pageId) {
  const idx = CHAPTER_ORDER.indexOf(pageId);
  const pct = idx >= 0 ? Math.round(((idx + 1) / CHAPTER_ORDER.length) * 100) : 0;
  $('navProgressBar').style.width = pct + '%';
}

/**
 * NOTIFICATIONS
 */

/**
 * Show notification message
 */
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

/**
 * AUTHENTICATION UI
 */

/**
 * Update authentication UI based on session
 */
export function updateAuthUI(session) {
  const authArea = $('navAuthArea');
  authArea.innerHTML = '';

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
  } else {
    authArea.innerHTML = `
      <button class="nav-auth-btn login" onclick="window.app.openAuth()">Login</button>
    `;
  }
}

/**
 * Switch between auth tabs (login/signup)
 */
export function switchAuthTab(tabName) {
  $('formLogin').style.display = tabName === 'login' ? 'flex' : 'none';
  $('formSignup').style.display = tabName === 'signup' ? 'flex' : 'none';

  $$('.modal-tab').forEach((x) => x.classList.remove('active'));
  const tabElement = tabName === 'login' ? $('tabLogin') : $('tabSignup');
  if (tabElement) tabElement.classList.add('active');
}

/**
 * MODALS
 */

/**
 * Open authentication modal
 */
export function openAuthModal() {
  closeMenuIfOpen();
  const modal = $('authModal');
  if (modal) {
    modal.classList.add('open');
    switchAuthTab('login');
    $('loginName').focus();
  }
}

/**
 * Close authentication modal
 */
export function closeAuthModal() {
  const modal = $('authModal');
  if (modal) modal.classList.remove('open');
}

/**
 * Open terms modal
 */
export function openTermsModal() {
  const modal = $('termsModal');
  if (modal) modal.classList.add('open');
}

/**
 * Close terms modal
 */
export function closeTermsModal() {
  const modal = $('termsModal');
  if (modal) modal.classList.remove('open');
}

/**
 * Open profile modal
 */
export function openProfileModal() {
  if (!window.currentSession) {
    openAuthModal();
    return;
  }
  const modal = $('profileModal');
  if (modal) modal.classList.add('open');
}

/**
 * Close profile modal
 */
export function closeProfileModal() {
  const modal = $('profileModal');
  if (modal) modal.classList.remove('open');
}

/**
 * PROGRESS TRACKING - UI UPDATES
 */

/**
 * Update completed chapter badges
 */
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

/**
 * Mark chapter as done
 */
export function markChapterDone(chapter) {
  completedChapters.add(chapter);
  updateCompletedBadges();
}

/**
 * Load completed chapters and update UI
 */
export function loadCompletedChapters(chapters) {
  completedChapters.clear();
  chapters.forEach((ch) => completedChapters.add(ch));
  updateCompletedBadges();
}

/**
 * MENU
 */

/**
 * Toggle mobile menu
 */
export function toggleMenu() {
  const menu = $('navMenu');
  if (menu) menu.classList.toggle('open');
}

/**
 * NAVBAR COMPONENT
 * Reusable navbar template for future extensibility
 * Can be injected into dynamic pages if needed
 */

/**
 * Generate navbar HTML component
 * @returns {string} HTML string for navbar element
 */
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

/**
 * Inject navbar into a container element
 * @param {string} containerId - ID of element to inject navbar into
 */
export function injectNavbar(containerId) {
  const container = $(containerId);
  if (container) {
    container.innerHTML = getNavbarHTML() + container.innerHTML;
  }
}

/**
 * Close menu if open
 * @private
 */
function closeMenuIfOpen() {
  const menu = $('navMenu');
  if (menu) menu.classList.remove('open');
}

/**
 * NAVIGATION HELPERS
 */

/**
 * Navigate to diagnostic (dark system)
 */
export function openDiagnostic() {
  closeMenuIfOpen();
  navigateToPage('dark-system');
}

/**
 * Navigate to guide content
 */
export function openGuide() {
  closeMenuIfOpen();
  navigateToPage('introduction');
}

/**
 * Open contact email
 */
export function openContact() {
  closeMenuIfOpen();
  window.location.href = 'mailto:mryoo.guide@gmail.com';
}
