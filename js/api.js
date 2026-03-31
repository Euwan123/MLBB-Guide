import { sb } from '../config/supabase.js';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mlbb_salt_yoo');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getAuthHeader() {
  return { 'Authorization': `Bearer ${sb.auth.session()?.access_token || ''}`, 'Content-Type': 'application/json' };
}

export async function loginWithCredentials(username, password) {
  const hashed = await hashPassword(password);
  const { data, error } = await sb
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('password_hash', hashed)
    .single();

  if (error || !data) throw new Error('Username or password incorrect');

  const session = { user: { id: data.id, user_metadata: { username: data.username } } };
  localStorage.setItem('mlbb_session', JSON.stringify(session));
  return session;
}

export async function signupWithCredentials(username, password) {
  const { data: existing } = await sb
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (existing) throw new Error('This username is already taken');

  const hashed = await hashPassword(password);
  const { data, error } = await sb
    .from('users')
    .insert([{ username: username.toLowerCase(), password_hash: hashed }])
    .select()
    .single();

  if (error) throw new Error(error.message || 'Signup failed');

  const session = { user: { id: data.id, user_metadata: { username: data.username } } };
  localStorage.setItem('mlbb_session', JSON.stringify(session));
  return session;
}

export async function signOut() {
  localStorage.removeItem('mlbb_session');
}

export async function getSession() {
  try {
    const raw = localStorage.getItem('mlbb_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback) {
  try {
    const raw = localStorage.getItem('mlbb_session');
    if (raw) callback('SIGNED_IN', JSON.parse(raw));
  } catch {}
  return null;
}

export async function uploadProfileImage(userId, file) {
  if (!userId || !file) throw new Error('User ID and file required');
  const fileName = `${userId}-${Date.now()}.jpg`;
  try {
    const { data, error } = await sb.storage.from('profile_images').upload(fileName, file, { upsert: true });
    if (error) throw new Error(error.message || 'Upload failed');
    const { data: urlData } = sb.storage.from('profile_images').getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  } catch (e) {
    return null;
  }
}

export async function saveUserProfile(userId, profileData) {
  if (!userId || !profileData) throw new Error('User ID and profile data required');
  try {
    const payload = {
      user_id: userId,
      username: profileData.username || null,
      bio: profileData.bio || null,
      rank: profileData.rank || null,
      win_rate: profileData.winRate || null,
      main_role: profileData.mainRole || null,
      total_matches: profileData.totalMatches || null,
      server_region: profileData.serverRegion || null,
      social_media: profileData.socialMedia || null,
      main_heroes: profileData.mainHeroes ? profileData.mainHeroes.split(',').map(h => h.trim()) : null,
      profile_image_url: profileData.profileImageUrl || null,
    };
    const { data, error } = await sb.from('user_profiles').upsert([payload], { onConflict: 'user_id' });
    if (error) throw new Error(error.message || 'Save failed');
    return data;
  } catch (e) {
    throw e;
  }
}

export async function loadUserProfile(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await sb.from('user_profiles').select('*').eq('user_id', userId).single();
    if (error) return null;
    return data || null;
  } catch (e) {
    return null;
  }
}

export async function loadChapterProgress(userId) {
  if (!userId) return [];
  try {
    const { data, error } = await sb.from('chapter_progress').select('chapter').eq('user_id', userId);
    if (error) return [];
    return (Array.isArray(data) ? data.map(r => r.chapter) : []) || [];
  } catch (e) {
    return [];
  }
}

export async function saveChapterProgress(userId, chapter) {
  if (!userId || !chapter) return;
  try {
    const { data, error } = await sb.from('chapter_progress').upsert([{ user_id: userId, chapter }], { onConflict: 'user_id,chapter' });
    if (error) return;
    return data;
  } catch (e) {
    return null;
  }
}

export async function loadQuizQuestions(quizKey) {
  try {
    const { data, error } = await sb
      .from('quiz_questions')
      .select('question, options, correct_index, explanation, difficulty')
      .eq('quiz_key', quizKey)
      .order('created_at', { ascending: true });
    if (error || !Array.isArray(data) || data.length === 0) return [];
    return data.map((q) => ({
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      correctIndex: typeof q.correct_index === 'number' ? q.correct_index : 0,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'normal',
    }));
  } catch {
    return [];
  }
}

export async function saveQuizResult(userId, quizKey, score, total, elapsedMs) {
  if (!userId || !quizKey) return;
  const payload = {
    user_id: userId,
    quiz_key: quizKey,
    score: Number(score) || 0,
    total_questions: Number(total) || 0,
    elapsed_ms: Number(elapsedMs) || 0,
    created_at: new Date().toISOString(),
  };
  const { error } = await sb.from('quiz_results').insert([payload]);
  if (error) throw new Error(error.message || 'Could not save quiz result');
}

export async function loadQuizLeaderboard(quizKey, limit = 10) {
  try {
    const { data, error } = await sb
      .from('quiz_results')
      .select('user_id, score, total_questions, elapsed_ms, created_at')
      .eq('quiz_key', quizKey)
      .order('score', { ascending: false })
      .order('elapsed_ms', { ascending: true })
      .limit(limit);
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}