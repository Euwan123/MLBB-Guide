let config = {};

export async function loadConfig() {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      config = await response.json();
      return config;
    }
  } catch (e) {
  }
  return config;
}

export function getConfig(key) { return config[key]; }
export function setConfig(key, value) { config[key] = value; }