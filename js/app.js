import { sb, CHAPTER_ORDER, CHAPTER_META, CHAPTER_PATHS } from '../config/supabase.js';

let cur = 'home';
let session = null;
let done = new Set();

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const notify = (msg, type = 'success', duration = 3000) => {
  const notif = $('notification');
  notif.textContent = msg;
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
};

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

const goHome = () => goPage('home');

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
    const usr = session.user.user_metadata?.username || 'User';
    const nm = (usr || '').substring(0, 1).toUpperCase();
    authArea.innerHTML = `<div class="nav-user" onclick="window.app.openProfile()" style="cursor:pointer;"><div class="nav-avatar">${nm}</div><span>${usr}</span></div><button class="nav-auth-btn logout" onclick="window.app.logout()">Logout</button>`;
  } else {
    authArea.innerHTML = `<button class="nav-auth-btn login" onclick="window.app.openAuth()">Login</button>`;
  }
};

const logout = async () => {
  await sb.auth.signOut();
  session = null;
  done.clear();
  updateAuthUI();
  goPage('home');
};

const openAuth = () => {
  $('authModal').classList.add('open');
  switchTab('login');
  $('loginName').focus();
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

const openProfile = () => {
  if (!session) {
    window.app.openAuth();
    return;
  }
  $('profileModal').classList.add('open');
  loadProfile();
};

const closeProfile = () => {
  $('profileModal').classList.remove('open');
};

const uploadProfileImage = async (file) => {
  if (!session) return null;
  
  try {
    const fileName = `${session.user.id}-${Date.now()}.jpg`;
    const { data, error } = await sb.storage
      .from('profile_images')
      .upload(fileName, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = sb.storage
      .from('profile_images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (e) {
    console.error('Image upload error:', e.message);
    throw e;
  }
};

const updateProfile = async (bio, rank, mainHeroes) => {
  if (!session) return;
  
  try {
    const imageFile = $('profileImageInput')?.files?.[0];
    let profileImageUrl = null;
    
    if (imageFile) {
      profileImageUrl = await uploadProfileImage(imageFile);
    }
    
    const usr = session.user.user_metadata?.username || 'User';
    const updateData = { 
      user_id: session.user.id, 
      username: usr, 
      bio: bio || null, 
      rank: rank || null, 
      main_heroes: mainHeroes ? mainHeroes.split(',').map(h => h.trim()) : null
    };
    
    if (profileImageUrl) {
      updateData.profile_image_url = profileImageUrl;
    }
    
    const { error } = await sb.from('user_profiles').upsert(updateData);
    if (error) throw error;
    
    closeProfile();
    alert('Profile updated!');
  } catch (e) {
    alert('Profile update failed: ' + e.message);
  }
};

const loadProfile = async () => {
  if (!session) return;
  
  try {
    const { data } = await sb.from('user_profiles').select('*').eq('user_id', session.user.id).single();
    
    if (data) {
      $('profileBio').value = data.bio || '';
      $('profileRank').value = data.rank || '';
      $('profileHeroes').value = data.main_heroes?.join(', ') || '';
      
      if (data.profile_image_url) {
        $('profileImagePreview').src = data.profile_image_url;
        $('profileImagePreview').style.display = 'block';
      }
    }
  } catch (e) {
    console.log('No profile found, creating new one');
  }
};

const switchTab = t => {
  $('formLogin').style.display = t === 'login' ? 'flex' : 'none';
  $('formSignup').style.display = t === 'signup' ? 'flex' : 'none';
  $$('.modal-tab').forEach(x => x.classList.remove('active'));
  t === 'login' ? $('tabLogin').classList.add('active') : $('tabSignup').classList.add('active');
};

const hashCode = str => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
};

const emailFromUsername = nm => `${nm.toLowerCase()}.${hashCode(nm)}@mlbbguide.app`;

const doLogin = async () => {
  const nm = $('loginName').value.trim();
  const pw = $('loginPass').value.trim();
  
  if (!nm || !pw) {
    $('loginErr').textContent = 'Username and password required';
    notify('Please enter username and password', 'warning', 2000);
    return;
  }

  if (nm.length < 3) {
    $('loginErr').textContent = 'Username must be at least 3 characters';
    return;
  }

  $('loginBtn').disabled = true;
  $('loginErr').textContent = '';

  try {
    const em = emailFromUsername(nm);
    const { data, error } = await sb.auth.signInWithPassword({ email: em, password: pw });
    if (error) {
      if (error.message?.includes('Invalid')) {
        throw new Error('Username or password incorrect');
      }
      throw error;
    }
    session = data.session;
    closeAuth();
    updateAuthUI();
    loadProgress();
    notify(`Welcome back, ${nm}!`, 'success', 2500);
  } catch (e) {
    const msg = e.message || 'Login failed';
    $('loginErr').textContent = msg;
    notify(msg, 'error', 3000);
    console.error('Login error:', e);
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
    const em = emailFromUsername(nm);
    const { data, error } = await sb.auth.signUp({ 
      email: em, 
      password: pw, 
      options: { 
        data: { username: nm },
        emailRedirectTo: window.location.origin
      } 
    });
    
    if (error) {
      if (error.message?.includes('already registered')) {
        throw new Error('This username is already taken');
      }
      if (error.message?.includes('rate limit')) {
        throw new Error('Too many signup attempts. Please wait a moment and try again.');
      }
      throw error;
    }
    
    session = data.session;
    if (session) {
      closeAuth();
      updateAuthUI();
      loadProgress();
    } else {
      $('signupErr').textContent = 'Account created! You can now login.';
      setTimeout(() => switchTab('login'), 1500);
    }
  } catch (e) {
    const msg = e.message || 'Signup failed';
    $('signupErr').textContent = msg.charAt(0).toUpperCase() + msg.slice(1);
  } finally {
    $('signupBtn').disabled = false;
  }
};

const initChapters = async () => {
  console.log('🚀 Initializing chapters...');
  console.log('📍 PagePathname:', window.location.pathname);
  console.log('🔗 Origin:', window.location.origin);
  
  const baseURL = window.location.pathname.includes('/mlbb-guide') ? '/mlbb-guide' : '';
  console.log('📂 Base URL:', baseURL || '(root)');
  
  for (const ch of CHAPTER_ORDER) {
    try {
      const path = `${baseURL}/html/${ch}.html`;
      console.log(`⏳ Loading ${ch} from: ${path}`);
      
      const resp = await fetch(path);
      
      if (!resp.ok) {
        console.error(`❌ Failed to load ${ch}: ${resp.status} ${resp.statusText}`);
        continue;
      }
      
      const html = await resp.text();
      console.log(`✅ Loaded ${ch} (${html.length} bytes)`);
      
      const el = document.createElement('div');
      el.innerHTML = html;
      el.id = `page-${ch}`;
      el.className = 'page';
      $('chapters-container').appendChild(el);
    } catch (e) {
      console.error(`💥 Error loading chapter ${ch}:`, e.message);
    }
  }
  
  console.log('📚 Chapter loading complete');
  
  setTimeout(() => {
    const tabsLogin = $('tabLogin');
    const tabsSignup = $('tabSignup');
    if (tabsLogin) tabsLogin.addEventListener('click', () => switchTab('login'));
    if (tabsSignup) tabsSignup.addEventListener('click', () => switchTab('signup'));
    
    const loginBtn = $('loginBtn');
    const signupBtn = $('signupBtn');
    if (loginBtn) loginBtn.addEventListener('click', doLogin);
    if (signupBtn) signupBtn.addEventListener('click', doSignup);
    
    $$('[data-chapter]').forEach(btn => {
      const ch = btn.dataset.chapter;
      btn.addEventListener('click', () => goPage(ch));
    });
    updateDoneMarks();
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

const calculateDarkSystem = () => {
  try {
    const matches = parseInt($('dsMatches').value) || 0;
    const wr = parseFloat($('dsWinrate').value) || 0;
    const mvps = parseInt($('dsMvp').value) || 0;
    
    if (matches === 0) {
      $('dsResult').style.display = 'none';
      return;
    }
    
    let expectedWr, expectedMvp;
    
    if (matches >= 5000) {
      expectedWr = 53;
      expectedMvp = Math.floor(matches / 10);
    } else if (matches >= 4000) {
      expectedWr = 52;
      expectedMvp = Math.floor(matches / 10);
    } else if (matches >= 3000) {
      expectedWr = 53;
      expectedMvp = Math.floor(matches / 10);
    } else if (matches >= 2000) {
      expectedWr = 54;
      expectedMvp = Math.floor(matches / 10);
    } else if (matches >= 1000) {
      expectedWr = 55;
      expectedMvp = Math.floor(matches / 10);
    } else {
      expectedWr = 52;
      expectedMvp = Math.floor(matches / 10);
    }
    
    const wrGood = wr >= expectedWr;
    const mvpGood = mvps >= expectedMvp;
    const mvpRatio = matches > 0 ? Math.round((matches / mvps) * 10) / 10 : 0;
    
    let status = 'NEEDS IMPROVEMENT';
    let statusClass = 'warning';
    
    if (wrGood && mvpGood) {
      status = '💚 GOOD PLAYER';
      statusClass = 'good';
    } else if (!wrGood && !mvpGood) {
      status = '💀 DARK SYSTEM';
      statusClass = 'dark';
    }
    
    const resultBox = $('dsResult');
    resultBox.className = `result-box-dark ${statusClass}`;
    resultBox.innerHTML = `
      <div class="result-title">${status}</div>
      <div class="result-stats">
        <div class="stat">
          <span class="label">Win Rate</span>
          <span class="value">${wr.toFixed(1)}%</span>
          <span class="verdict ${wrGood ? 'pass' : 'fail'}">${wrGood ? '✓ Good' : '✗ Low'}</span>
        </div>
        <div class="stat">
          <span class="label">Expected WR</span>
          <span class="value">${expectedWr}%+</span>
          <span class="verdict"></span>
        </div>
        <div class="stat">
          <span class="label">MVP Count</span>
          <span class="value">${mvps}</span>
          <span class="verdict ${mvpGood ? 'pass' : 'fail'}">${mvpGood ? '✓ Good' : '✗ Low'}</span>
        </div>
        <div class="stat">
          <span class="label">Expected MVPs</span>
          <span class="value">${expectedMvp}+</span>
          <span class="verdict"></span>
        </div>
      </div>
    `;
    resultBox.style.display = 'block';
  } catch (e) {
    console.error('Dark system calculation error:', e.message);
    alert('Error calculating analysis. Please check your inputs.');
  }
};

const toggleMenu = () => {
  const menu = $('navMenu');
  if (menu) menu.classList.toggle('open');
};

const closeMenu = () => {
  const menu = $('navMenu');
  if (menu) menu.classList.remove('open');
};

const openDiagnostic = () => {
  closeMenu();
  goPage('dark-system');
};

const openGuide = () => {
  closeMenu();
  goPage('introduction');
};

const openContact = () => {
  closeMenu();
  window.location.href = 'mailto:mryoo.guide@gmail.com';
};

window.app = {
  goPage,
  openAuth,
  closeAuth,
  openTerms,
  closeTerms,
  openProfile,
  closeProfile,
  uploadProfileImage,
  updateProfile,
  loadProfile,
  switchTab,
  doLogin,
  doSignup,
  logout,
  init,
  calculateDarkSystem,
  toggleMenu,
  closeMenu,
  openDiagnostic,
  openGuide,
  openContact,
  notify
};

window.nav = {
  goHome,
  goTo: goPage
};

document.addEventListener('DOMContentLoaded', init);
