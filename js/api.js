import { sb } from '../config/supabase.js';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mlbb_salt_yoo');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
  const { error } = await sb.storage.from('profile_images').upload(fileName, file, { upsert: true });
  if (error) throw new Error(error.message || 'Upload failed');
  const { data: { publicUrl } } = sb.storage.from('profile_images').getPublicUrl(fileName);
  return publicUrl;
}

export async function saveUserProfile(userId, profileData) {
  if (!userId || !profileData) throw new Error('User ID and profile data required');
  const { error } = await sb.from('user_profiles').upsert({
    user_id: userId,
    username: profileData.username,
    bio: profileData.bio || null,
    rank: profileData.rank || null,
    main_heroes: profileData.mainHeroes ? profileData.mainHeroes.split(',').map(h => h.trim()) : null,
    profile_image_url: profileData.profileImageUrl || null,
  });
  if (error) throw new Error(error.message || 'Save failed');
}

export async function loadUserProfile(userId) {
  if (!userId) throw new Error('User ID required');
  const { data, error } = await sb.from('user_profiles').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') return null;
  return data || null;
}

export async function loadChapterProgress(userId) {
  if (!userId) return [];
  const { data, error } = await sb.from('chapter_progress').select('chapter').eq('user_id', userId);
  if (error) return [];
  return data.map(r => r.chapter) || [];
}

export async function saveChapterProgress(userId, chapter) {
  if (!userId || !chapter) return;
  const { error } = await sb.from('chapter_progress').upsert(
    [{ user_id: userId, chapter }],
    { onConflict: 'user_id,chapter' }
  );
  if (error) throw new Error(error.message || 'Save failed');
}