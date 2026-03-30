import { sb } from '../config/supabase.js';

const toEmail = (username) => `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@mlbbguide.app`;

export async function loginWithCredentials(username, password) {
  const email = toEmail(username);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Username or password incorrect');
  if (!data.session) throw new Error('No session returned');
  return data.session;
}

export async function signupWithCredentials(username, password) {
  const email = toEmail(username);
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username }, emailRedirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message || 'Signup failed');
  return data.session;
}

export async function signOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw new Error(error.message || 'Logout failed');
}

export async function getSession() {
  try {
    if (!sb) {
      console.warn('Supabase not initialized');
      return null;
    }
    const { data: { session } } = await sb.auth.getSession();
    return session;
  } catch (e) {
    console.error('getSession error:', e);
    return null;
  }
}

export function onAuthStateChange(callback) {
  try {
    if (!sb) {
      console.warn('Supabase not initialized, onAuthStateChange skipped');
      return null;
    }
    const { data: { subscription } } = sb.auth.onAuthStateChange(callback);
    return subscription;
  } catch (e) {
    console.error('onAuthStateChange error:', e);
    return null;
  }
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
    main_heroes: profileData.mainHeroes ? profileData.mainHeroes.split(',').map((h) => h.trim()) : null,
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
  return data.map((r) => r.chapter) || [];
}

export async function saveChapterProgress(userId, chapter) {
  if (!userId || !chapter) return;
  const { error } = await sb.from('chapter_progress').upsert(
    [{ user_id: userId, chapter }],
    { onConflict: 'user_id,chapter' }
  );
  if (error) throw new Error(error.message || 'Save failed');
}