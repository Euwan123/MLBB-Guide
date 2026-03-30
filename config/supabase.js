import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const sb = createClient(
  'https://bhvbcwgpsfhzjgaotsjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodmJjd2dwc2ZoempnYW90c2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzg2NjAsImV4cCI6MjA5MDM1NDY2MH0.sEQGO9do4vTBmgZUxvV-SoQ7Qbw0gNc9YuxS-O0qvEw'
);

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
  'introduction':      { n: '01', t: 'Introduction' },
  'quick-reference':   { n: '02', t: 'Quick Reference' },
  'role-selection':    { n: '03', t: 'Role Selection' },
  'macro-micro':       { n: '04', t: 'Macro vs Micro' },
  'laning':            { n: '05', t: 'Laning' },
  'banning':           { n: '06', t: 'Banning' },
  'counter-heroes':    { n: '07', t: 'Counter Heroes' },
  'mental-tilt':       { n: '08', t: 'Mental & Tilt' },
  'dark-system':       { n: 'A1', t: 'Are You a Dark System?' },
  'meta-tracker':      { n: 'A2', t: 'Meta Tracker' },
  'player-tiers':      { n: 'A3', t: 'Player Tiers' },
  'hero-requirements': { n: 'A4', t: 'Hero Requirements' }
};

export const CHAPTER_PATHS = CHAPTER_ORDER.map(ch => `html/${ch}.html`);