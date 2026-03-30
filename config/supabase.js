import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { loadConfig } from './env.js';

const config = await loadConfig();
const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase credentials missing! Check config.json or environment variables');
}

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const CHAPTER_ORDER = [
  'introduction',
  'quick-reference',
  'role-selection',
  'macro-micro',
  'laning',
  'banning',
  'counter-heroes',
  'mental-tilt',
  'dark-system',
  'meta-tracker',
  'player-tiers',
  'hero-requirements'
];

export const CHAPTER_META = {
  'introduction':{n:'01',t:'Introduction'},
  'quick-reference':{n:'02',t:'Quick Reference'},
  'role-selection':{n:'03',t:'Role Selection'},
  'macro-micro':{n:'04',t:'Macro vs Micro'},
  'laning':{n:'05',t:'Laning'},
  'banning':{n:'06',t:'Banning'},
  'counter-heroes':{n:'07',t:'Counter Heroes'},
  'mental-tilt':{n:'08',t:'Mental & Tilt'},
  'dark-system':{n:'A1',t:'Are You a Dark System?'},
  'meta-tracker':{n:'A2',t:'Meta Tracker'},
  'player-tiers':{n:'A3',t:'Player Tiers'},
  'hero-requirements':{n:'A4',t:'Hero Requirements'}
};

export const CHAPTER_PATHS = CHAPTER_ORDER.map(ch => `html/${ch}.html`);