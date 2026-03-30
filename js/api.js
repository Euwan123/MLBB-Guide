import { sb } from '../config/supabase.js';

const generateEmailFromUsername = (username) => {
  let h = 0;
  for (let i = 0; i < username.length; i++) {
    h = ((h << 5) - h) + username.charCodeAt(i) | 0;
  }
  const hash = Math.abs(h).toString(36);
  return `${username.toLowerCase()}.${hash}@mlbbguide.app`;
};

export async function loginWithCredentials(username, password) {
  try {
    const email = generateEmailFromUsername(username);
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message || 'Login failed');
    if (!data.session) throw new Error('No session returned');
    return data.session;
  } catch (e) {
    console.error('Login error:', e);
    throw e;
  }
}

export async function signupWithCredentials(username, password) {
  try {
    const email = generateEmailFromUsername(username);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message || 'Signup failed');
    return data.session;
  } catch (e) {
    console.error('Signup error:', e);
    throw e;
  }
}

export async function signOut() {
  try {
    const { error } = await sb.auth.signOut();
    if (error) throw new Error(error.message || 'Logout failed');
  } catch (e) {
    console.error('Logout error:', e);
    throw e;
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) throw new Error(error.message || 'Session failed');
    return session;
  } catch (e) {
    console.error('Session error:', e);
    return null;
  }
}

export function onAuthStateChange(callback) {
  try {
    const { data: { subscription } } = sb.auth.onAuthStateChange(callback);
    return subscription;
  } catch (e) {
    console.error('Auth listener error:', e);
    return null;
  }
}

export async function uploadProfileImage(userId, file) {
  try {
    if (!userId || !file) throw new Error('User ID and file required');
    const fileName = `${userId}-${Date.now()}.jpg`;
    const { error } = await sb.storage.from('profile_images').upload(fileName, file, { upsert: true });
    if (error) throw new Error(error.message || 'Upload failed');
    const { data: { publicUrl } } = sb.storage.from('profile_images').getPublicUrl(fileName);
    return publicUrl;
  } catch (e) {
    console.error('Image upload error:', e);
    throw e;
  }
}

export async function saveUserProfile(userId, profileData) {
  try {
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
  } catch (e) {
    console.error('Profile save error:', e);
    throw e;
  }
}

export async function loadUserProfile(userId) {
  try {
    if (!userId) throw new Error('User ID required');
    const { data, error } = await sb.from('user_profiles').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message || 'Load failed');
    return data || null;
  } catch (e) {
    console.error('Profile load error:', e);
    return null;
  }
}

export async function loadChapterProgress(userId) {
  try {
    if (!userId) throw new Error('User ID required');
    const { data, error } = await sb.from('chapter_progress').select('chapter').eq('user_id', userId);
    if (error) throw new Error(error.message || 'Progress load failed');
    return data.map((r) => r.chapter) || [];
  } catch (e) {
    console.error('Progress load error:', e);
    return [];
  }
}

export async function saveChapterProgress(userId, chapter) {
  try {
    if (!userId || !chapter) throw new Error('User ID and chapter required');
    const { error } = await sb.from('chapter_progress').insert([{ user_id: userId, chapter }]).on('*', 'upsert').eq('user_id', userId);
    if (error) throw new Error(error.message || 'Save failed');
  } catch (e) {
    console.error('Progress save error:', e);
    throw e;
  }
}
