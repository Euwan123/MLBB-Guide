/**
 * Environment Configuration Loader
 * Loads configuration from config.json (not committed to git)
 * Falls back to .env via build process or environment variables
 */

let config = {};

export async function loadConfig() {
  try {
    // Try to load from config.json first (production safe)
    const response = await fetch('/config.json');
    if (response.ok) {
      config = await response.json();
      console.log('✅ Config loaded from config.json');
      return config;
    }
  } catch (e) {
    console.log('📝 config.json not found, using environment variables');
  }

  // Fallback: Read from environment (if available in build process)
  config = {
    SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY,
  };

  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase configuration not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  }

  return config;
}

export function getConfig(key) {
  return config[key];
}

export function setConfig(key, value) {
  config[key] = value;
}
