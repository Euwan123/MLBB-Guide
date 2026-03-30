/**
 * API.JS - Supabase & Backend Integration
 * Handles all data operations: authentication, profiles, progress tracking
 * Separates backend concerns from UI and business logic
 */

import { sb } from '../config/supabase.js';

/**
 * AUTHENTICATION
 */

/**
 * Perform login with username and password
 * Uses generated email from username for Supabase
 * @param {string} username - Username (3-20 chars)
 * @param {string} password - Password (8+ chars)
 * @returns {Promise} Session or error
 */
export async function loginWithCredentials(username, password) {
  const email = generateEmailFromUsername(username);
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session;
}

/**
 * Register new account with username and password
 * @param {string} username - Unique username
 * @param {string} password - Password
 * @returns {Promise} Session or null if email confirmation required
 */
export async function signupWithCredentials(username, password) {
  const email = generateEmailFromUsername(username);
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return data.session;
}

/**
 * Sign out current user
 */
export async function signOut() {
  await sb.auth.signOut();
}

/**
 * Get current session
 */
export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback) {
  return sb.auth.onAuthStateChange(callback);
}

/**
 * PROFILE MANAGEMENT
 */

/**
 * Upload profile image to Supabase storage
 */
export async function uploadProfileImage(userId, file) {
  const fileName = `${userId}-${Date.now()}.jpg`;
  const { data, error } = await sb.storage
    .from('profile_images')
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data: { publicUrl } } = sb.storage
    .from('profile_images')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Save or update user profile
 */
export async function saveUserProfile(userId, profileData) {
  const { error } = await sb.from('user_profiles').upsert({
    user_id: userId,
    username: profileData.username,
    bio: profileData.bio || null,
    rank: profileData.rank || null,
    main_heroes: profileData.mainHeroes
      ? profileData.mainHeroes.split(',').map((h) => h.trim())
      : null,
    profile_image_url: profileData.profileImageUrl || null,
  });

  if (error) throw error;
}

/**
 * Load user profile
 */
export async function loadUserProfile(userId) {
  const { data, error } = await sb
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return data || null;
}

/**
 * PROGRESS TRACKING
 */

/**
 * Load chapter progress for user
 */
export async function loadChapterProgress(userId) {
  const { data, error } = await sb
    .from('chapter_progress')
    .select('chapter')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map((r) => r.chapter) || [];
}

/**
 * Mark chapter as completed
 */
export async function saveChapterProgress(userId, chapter) {
  const { error } = await sb
    .from('chapter_progress')
    .insert([{ user_id: userId, chapter }])
    .onConflict('user_id,chapter')
    .merge();

  if (error) throw error;
}

/**
 * UTILITIES
 */

/**
 * Generate email from username for authentication
 * SECURITY: Only for internal use - demonstrates username-based auth
 * @private
 */
function generateEmailFromUsername(username) {
  const hash = hashCode(username);
  return `${username.toLowerCase()}.${hash}@mlbbguide.app`;
}

/**
 * Simple hash function for username
 * @private
 */
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(36);
}
