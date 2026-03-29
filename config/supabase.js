import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://bhvbcwgpsfhzjgaotsjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodmJjd2dwc2ZoempnYW90c2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzg2NjAsImV4cCI6MjA5MDM1NDY2MH0.sEQGO9do4vTBmgZUxvV-SoQ7Qbw0gNc9YuxS-O0qvEw';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const CHAPTER_ORDER = ['macro-micro','player-tiers','dark-system','hero-requirements','quick-reference','role-selection','mental-tilt','laning','banning'];

export const CHAPTER_META = {
  'macro-micro':{n:'01',t:'Macro vs Micro'},
  'player-tiers':{n:'02',t:'Player Tiers'},
  'dark-system':{n:'03',t:'Are You a Dark System?'},
  'hero-requirements':{n:'04',t:'Hero Requirements'},
  'quick-reference':{n:'05',t:'Quick Reference'},
  'role-selection':{n:'06',t:'Role Selection'},
  'mental-tilt':{n:'07',t:'Mental & Tilt'},
  'laning':{n:'08',t:'Laning'},
  'banning':{n:'09',t:'Banning'}
};

export const CHAPTER_PATHS = CHAPTER_ORDER.map(ch => `html/${ch}.html`);
