import { sb, CHAPTER_ORDER, CHAPTER_META, CHAPTER_PATHS } from '../config/supabase.js';

let cur = 'home';
let session = null;
let done = new Set();

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const goPage = page => {
  const old = $(`page-${cur}`);
  if (old) old.classList.remove('active');
  cur = page;
  const nw = $(`page-${page}`);
  if (nw) nw.classList.add('active');

  if (page === 'home') {
    $('navBack').classList.remove('show');
    $('navChapter').textContent = '';
    $('navProgress').style.display = 'none';
  } else {
    $('navBack').classList.add('show');
    const m = CHAPTER_META[page];
    if (m) $('navChapter').textContent = `Chapter ${m.n} — ${m.t}`;
    $('navProgress').style.display = 'block';
    updateProgress(page);
    if (!done.has(page)) markDone(page);
  }

  window.scrollTo(0, 0);
};

const updateProgress = page => {
  const idx = CHAPTER_ORDER.indexOf(page);
  const pct = idx >= 0 ? Math.round(((idx + 1) / CHAPTER_ORDER.length) * 100) : 0;
  $('navProgressBar').style.width = pct + '%';
};

const markDone = ch => {
  saveProgress(ch);
};

const updateDoneMarks = () => {
  $$('.chapter-btn').forEach(btn => {
    const ch = btn.dataset.chapter;
    if (done.has(ch)) btn.classList.add('done');
    else btn.classList.remove('done');
  });
};

const loadProgress = async () => {
  if (!session) return;
  try {
    const { data } = await sb.from('chapter_progress').select('chapter').eq('user_id', session.user.id);
    done.clear();
    if (data) data.forEach(r => done.add(r.chapter));
    updateDoneMarks();
  } catch (e) {
    console.error('Progress load error');
  }
};

const saveProgress = async (ch) => {
  if (!session) return;
  try {
    await sb.from('chapter_progress').insert([{ user_id: session.user.id, chapter: ch }]).onConflict('user_id,chapter').merge();
    done.add(ch);
    updateDoneMarks();
  } catch (e) {
    console.error('Progress save error');
  }
};

const updateAuthUI = () => {
  const authArea = $('navAuthArea');
  authArea.innerHTML = '';

  if (session) {
    const usr = session.user.user_metadata?.username || session.user.email;
    const nm = (usr || '').substring(0, 1).toUpperCase();
    authArea.innerHTML = `<div class="nav-user"><div class="nav-avatar">${nm}</div><span>${usr}</span></div><button class="nav-auth-btn logout" onclick="window.app.logout()">Logout</button>`;
  } else {
    authArea.innerHTML = `<button class="nav-auth-btn login" onclick="window.app.openAuth()">Login</button>`;
  }
};

const logoutUser = async () => {
  await sb.auth.signOut();
  session = null;
  done.clear();
  updateAuthUI();
  goPage('home');
};

const openAuth = () => {
  $('authModal').classList.add('open');
  switchTab('login');
  $('loginEmail').focus();
};

const closeAuth = () => {
  $('authModal').classList.remove('open');
};

const openTerms = () => {
  $('termsModal').classList.add('open');
};

const closeTerms = () => {
  $('termsModal').classList.remove('open');
};

const switchTab = t => {
  $('formLogin').style.display = t === 'login' ? 'flex' : 'none';
  $('formSignup').style.display = t === 'signup' ? 'flex' : 'none';
  $$('.modal-tab').forEach(x => x.classList.remove('active'));
  t === 'login' ? $('tabLogin').classList.add('active') : $('tabSignup').classList.add('active');
};

const doLogin = async () => {
  const em = $('loginEmail').value.trim();
  const pw = $('loginPass').value.trim();
  
  if (!em || !pw) {
    $('loginErr').textContent = 'Email and password required';
    return;
  }

  $('loginBtn').disabled = true;
  $('loginErr').textContent = '';

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email: em, password: pw });
    if (error) throw error;
    session = data.session;
    closeAuth();
    updateAuthUI();
    loadProgress();
  } catch (e) {
    $('loginErr').textContent = e.message || 'Login failed';
  } finally {
    $('loginBtn').disabled = false;
  }
};

const doSignup = async () => {
  const nm = $('signupName').value.trim();
  const em = $('signupEmail').value.trim();
  const pw = $('signupPass').value.trim();
  
  if (!nm || !em || !pw) {
    $('signupErr').textContent = 'All fields required';
    return;
  }

  if (pw.length < 6) {
    $('signupErr').textContent = 'Password must be at least 6 characters';
    return;
  }

  $('signupBtn').disabled = true;
  $('signupErr').textContent = '';

  try {
    const { data, error } = await sb.auth.signUp({ email: em, password: pw, options: { data: { username: nm } } });
    if (error) throw error;
    
    session = data.session;
    if (session) {
      closeAuth();
      updateAuthUI();
      loadProgress();
    } else {
      $('signupErr').textContent = 'Check your email to confirm';
    }
  } catch (e) {
    $('signupErr').textContent = e.message || 'Signup failed';
  } finally {
    $('signupBtn').disabled = false;
  }
};

const initChapters = async () => {
  for (const ch of CHAPTER_ORDER) {
    const resp = await fetch(`html/${ch}.html`);
    if (!resp.ok) continue;
    const html = await resp.text();
    const el = document.createElement('div');
    el.innerHTML = html;
    el.id = `page-${ch}`;
    el.className = 'page';
    $('chapters-container').appendChild(el);
  }
  
  setTimeout(() => {
    $$('[data-chapter]').forEach(btn => {
      const ch = btn.dataset.chapter;
      btn.addEventListener('click', () => goPage(ch));
    });
  }, 100);
};

const init = async () => {
  const { data: { session: s } } = await sb.auth.getSession();
  session = s;
  updateAuthUI();
  if (session) loadProgress();

  sb.auth.onAuthStateChange((ev, s) => {
    session = s;
    updateAuthUI();
    if (s) loadProgress();
    else done.clear();
  });

  initChapters();
};

window.app = {
  goPage,
  openAuth,
  closeAuth,
  openTerms,
  closeTerms,
  switchTab,
  doLogin,
  doSignup,
  logout: logoutUser,
  init
};

window.nav = {
  goHome: () => goPage('home'),
  goTo: ch => goPage(ch),
  logout: logoutUser
};

document.addEventListener('DOMContentLoaded', init);
