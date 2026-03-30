let config = {};

export async function loadConfig() {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      config = await response.json();
      return config;
    }
  } catch (e) {
    console.error('config.json not found');
  }

  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    console.error('Supabase configuration not found. Please provide config.json with SUPABASE_URL and SUPABASE_ANON_KEY');
  }

  return config;
}

export function getConfig(key) {
  return config[key];
}

export function setConfig(key, value) {
  config[key] = value;
}