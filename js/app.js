import { sb, CHAPTER_ORDER, CHAPTER_META } from '../config/supabase.js';
import * as api from './api.js';
import * as ui from './ui.js';
import * as logic from './logic.js';

let session = null;
let deferredPrompt = null;

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
      const bio = $('profileBio'); if (bio) bio.value = profile.bio || '';
      const rank = $('profileRank'); if (rank) rank.value = profile.rank || '';
      const heroes = $('profileHeroes'); if (heroes) heroes.value = profile.main_heroes?.join(', ') || '';
      const img = $('profileImagePreview');
      if (img && profile.profile_image_url) { img.src = profile.profile_image_url; img.style.display = 'block'; }
    }
  } catch {}
};

const updateProfile = async (bio, rank, mainHeroes) => {
  if (!session) return;
  try {
    const imageFile = $('profileImageInput')?.files?.[0];
    let profileImageUrl = null;
    if (imageFile) profileImageUrl = await api.uploadProfileImage(session.user.id, imageFile);
    const username = session.user.user_metadata?.username || 'User';
    await api.saveUserProfile(session.user.id, { username, bio, rank, mainHeroes, profileImageUrl });
    ui.closeProfileModal();
    ui.notify('Profile updated!', 'success', 2000);
  } catch (e) {
    ui.notify('Profile update failed: ' + e.message, 'error', 3000);
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
  for (const ch of CHAPTER_ORDER) {
    try {
      const resp = await fetch(`${baseURL}/html/${ch}.html`);
      if (!resp.ok) continue;
      const html = await resp.text();
      const el = document.createElement('div');
      el.innerHTML = html;
      el.id = `page-${ch}`;
      el.className = 'page';
      $('chapters-container').appendChild(el);
    } catch {}
  }
  setupEventListeners();
};

const setupEventListeners = () => {
  const loginBtn = $('loginBtn');
  const signupBtn = $('signupBtn');
  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  if (signupBtn) signupBtn.addEventListener('click', doSignup);

  const loginPass = $('loginPass');
  if (loginPass) loginPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  const signupPass = $('signupPass');
  if (signupPass) signupPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSignup(); });

  document.querySelectorAll('[data-chapter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ch = btn.dataset.chapter;
      ui.navigateToPage(ch);
      markChapterCompleted(ch);
    });
  });

  ui.updateCompletedBadges();
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
  await initChapters();
};

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

document.addEventListener('DOMContentLoaded', init);