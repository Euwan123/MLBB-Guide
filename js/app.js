import { sb, CHAPTER_ORDER, CHAPTER_META, CHAPTER_PATHS } from '../config/supabase.js';
import * as api from './api.js';
import * as ui from './ui.js';
import * as logic from './logic.js';

let session = null;

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const goPage = (pageId) => ui.navigateToPage(pageId);
const goHome = () => ui.navigateHome();

const doLogin = async () => {
  const nm = $('loginName').value.trim();
  const pw = $('loginPass').value.trim();

  if (!nm || !pw) {
    $('loginErr').textContent = 'Username and password required';
    ui.notify('Please enter username and password', 'warning', 2000);
    return;
  }

  if (nm.length < 3) {
    $('loginErr').textContent = 'Username must be at least 3 characters';
    return;
  }

  $('loginBtn').disabled = true;
  $('loginErr').textContent = '';

  try {
    session = await api.loginWithCredentials(nm, pw);
    ui.closeAuthModal();
    ui.updateAuthUI(session);
    await loadProgressForSession();
    ui.notify(`Welcome back, ${nm}!`, 'success', 2500);
  } catch (e) {
    const msg = e.message?.includes('Invalid') ? 'Username or password incorrect' : (e.message || 'Login failed');
    $('loginErr').textContent = msg;
    ui.notify(msg, 'error', 3000);
  } finally {
    $('loginBtn').disabled = false;
  }
};

const doSignup = async () => {
  const nm = $('signupName').value.trim();
  const pw = $('signupPass').value.trim();

  if (!nm || !pw) {
    $('signupErr').textContent = 'Username and password required';
    return;
  }
  if (nm.length < 3) {
    $('signupErr').textContent = 'Username must be at least 3 characters';
    return;
  }
  if (nm.length > 20) {
    $('signupErr').textContent = 'Username must be 20 characters or less';
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(nm)) {
    $('signupErr').textContent = 'Username can only contain letters, numbers, and underscores';
    return;
  }
  if (pw.length < 8) {
    $('signupErr').textContent = 'Password must be at least 8 characters';
    return;
  }

  $('signupBtn').disabled = true;
  $('signupErr').textContent = '';

  try {
    session = await api.signupWithCredentials(nm, pw);
    if (session) {
      ui.closeAuthModal();
      ui.updateAuthUI(session);
      await loadProgressForSession();
      ui.notify(`Welcome, ${nm}!`, 'success', 2500);
    } else {
      $('signupErr').textContent = 'Account created! You can now login.';
      setTimeout(() => ui.switchAuthTab('login'), 1500);
    }
  } catch (e) {
    const msg = e.message?.includes('already registered')
      ? 'This username is already taken'
      : e.message || 'Signup failed';
    $('signupErr').textContent = msg.charAt(0).toUpperCase() + msg.slice(1);
  } finally {
    $('signupBtn').disabled = false;
  }
};

const logout = async () => {
  await api.signOut();
  session = null;
  ui.loadCompletedChapters([]);
  ui.updateAuthUI(null);
  ui.navigateHome();
};

const openProfile = () => {
  if (!session) {
    ui.openAuthModal();
    return;
  }
  ui.openProfileModal();
  loadProfile();
};

const loadProfile = async () => {
  if (!session) return;
  try {
    const profile = await api.loadUserProfile(session.user.id);
    if (profile) {
      $('profileBio').value = profile.bio || '';
      $('profileRank').value = profile.rank || '';
      $('profileHeroes').value = profile.main_heroes?.join(', ') || '';
      if (profile.profile_image_url) {
        $('profileImagePreview').src = profile.profile_image_url;
        $('profileImagePreview').style.display = 'block';
      }
    }
  } catch (e) {
    console.log('No profile found');
  }
};

const updateProfile = async (bio, rank, mainHeroes) => {
  if (!session) return;
  try {
    const imageFile = $('profileImageInput')?.files?.[0];
    let profileImageUrl = null;
    if (imageFile) {
      profileImageUrl = await api.uploadProfileImage(session.user.id, imageFile);
    }
    const username = session.user.user_metadata?.username || 'User';
    await api.saveUserProfile(session.user.id, {
      username,
      bio: bio || null,
      rank: rank || null,
      mainHeroes,
      profileImageUrl,
    });
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
  } catch (e) {
    console.error('Progress load error:', e);
  }
};

const markChapterCompleted = async (chapter) => {
  if (!session) return;
  try {
    await api.saveChapterProgress(session.user.id, chapter);
    ui.markChapterDone(chapter);
  } catch (e) {
    console.error('Progress save error:', e);
  }
};

const initChapters = async () => {
  const baseURL = window.location.pathname.includes('/mlbb-guide') ? '/mlbb-guide' : '';

  for (const ch of CHAPTER_ORDER) {
    try {
      const path = `${baseURL}/html/${ch}.html`;
      const resp = await fetch(path);
      if (!resp.ok) {
        console.error(`Failed to load ${ch}: ${resp.status}`);
        continue;
      }
      const html = await resp.text();
      const el = document.createElement('div');
      el.innerHTML = html;
      el.id = `page-${ch}`;
      el.className = 'page';
      $('chapters-container').appendChild(el);
    } catch (e) {
      console.error(`Error loading chapter ${ch}:`, e.message);
    }
  }

  setTimeout(() => {
    setupEventListeners();
  }, 100);
};

const setupEventListeners = () => {
  const loginBtn = $('loginBtn');
  const signupBtn = $('signupBtn');
  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  if (signupBtn) signupBtn.addEventListener('click', doSignup);

  $$('[data-chapter]').forEach((btn) => {
    const ch = btn.dataset.chapter;
    btn.addEventListener('click', () => {
      ui.navigateToPage(ch);
      markChapterCompleted(ch);
    });
  });

  ui.updateCompletedBadges();
};

const calculateDarkSystem = () => {
  try {
    const matches = parseInt($('dsMatches').value) || 0;
    const wr = parseFloat($('dsWinrate').value) || 0;
    const mvps = parseInt($('dsMvp').value) || 0;

    if (matches === 0) {
      $('dsResult').style.display = 'none';
      return;
    }

    const result = logic.analyzeDarkSystem(matches, wr, mvps);
    if (!result) {
      $('dsResult').style.display = 'none';
      return;
    }

    const resultBox = $('dsResult');
    resultBox.className = `result-box-dark ${result.classificationClass}`;
    resultBox.innerHTML = `
      <div class="result-title">${result.classification}</div>
      <div class="result-stats">
        <div class="stat">
          <span class="label">Win Rate</span>
          <span class="value">${result.currentWR.toFixed(1)}%</span>
          <span class="verdict ${result.wrPasses ? 'pass' : 'fail'}">${result.wrPasses ? '✓ Good' : '✗ Low'}</span>
        </div>
        <div class="stat">
          <span class="label">Expected WR</span>
          <span class="value">${result.expectedWR}%+</span>
          <span class="verdict"></span>
        </div>
        <div class="stat">
          <span class="label">MVP Count</span>
          <span class="value">${result.currentMVP}</span>
          <span class="verdict ${result.mvpPasses ? 'pass' : 'fail'}">${result.mvpPasses ? '✓ Good' : '✗ Low'}</span>
        </div>
        <div class="stat">
          <span class="label">Expected MVPs</span>
          <span class="value">${result.expectedMVP}+</span>
          <span class="verdict"></span>
        </div>
      </div>
    `;
    resultBox.style.display = 'block';
  } catch (e) {
    ui.notify('Error calculating analysis. Please check your inputs.', 'error', 3000);
  }
};

const init = async () => {
  session = await api.getSession();
  ui.updateAuthUI(session);

  if (session) {
    await loadProgressForSession();
  }

  api.onAuthStateChange((event, newSession) => {
    session = newSession;
    ui.updateAuthUI(newSession);
    if (newSession) {
      loadProgressForSession();
    } else {
      ui.loadCompletedChapters([]);
    }
  });

  initChapters();
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
  init,
};

window.nav = {
  goHome: ui.navigateHome,
  goTo: ui.navigateToPage,
};

document.addEventListener('DOMContentLoaded', init);