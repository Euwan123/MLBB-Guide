import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const sb = createClient(
  'https://bhvbcwgpsfhzjgaotsjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodmJjd2dwc2ZoempnYW90c2piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Nzg2NjAsImV4cCI6MjA5MDM1NDY2MH0.sEQGO9do4vTBmgZUxvV-SoQ7Qbw0gNc9YuxS-O0qvEw'
);

export const CHAPTER_ORDER = [
  'introduction',
  'quick-reference',
  'role-selection',
  'common-mistakes',
  'macro-micro',
  'rotation-system',
  'decision-making',
  'laning',
  'banning',
  'counter-heroes',
  'mental-tilt',
  'dark-system',
  'wave-management',
  'vision-map-awareness',
  'power-spikes',
  'win-conditions',
  'common-sense',
  'profile-percentile',
  'reaction-challenge',
  'itemization-quiz',
  'hero-system',
  'tier-lists',
  'content-creators',
  'faq'
];

export const CHAPTER_META = {
  'introduction':      { n: '01', t: 'Introduction' },
  'quick-reference':   { n: '02', t: 'Quick Reference' },
  'role-selection':    { n: '03', t: 'Role Selection' },
  'common-mistakes':   { n: 'B7', t: 'Common Mistakes' },
  'macro-micro':       { n: '04', t: 'Macro vs Micro' },
  'rotation-system':   { n: 'M2', t: 'Rotation System' },
  'decision-making':   { n: 'M4', t: 'Decision Making' },
  'laning':            { n: '05', t: 'Laning' },
  'banning':           { n: '06', t: 'Banning' },
  'counter-heroes':    { n: '07', t: 'Counter Heroes' },
  'mental-tilt':       { n: 'M3', t: 'Mental & Tilt' },
  'dark-system':       { n: 'A1', t: 'Are You a Dark System?' },
  'wave-management':   { n: 'A5', t: 'Wave Management' },
  'vision-map-awareness': { n: 'A6', t: 'Vision & Map Awareness' },
  'power-spikes':      { n: 'A3', t: 'Power Spikes' },
  'win-conditions':    { n: 'A4', t: 'Win Conditions' },
  'common-sense':      { n: 'A5', t: 'Common Sense' },
  'profile-percentile': { n: 'D2', t: 'Profile Percentile' },
  'reaction-challenge': { n: 'D3', t: 'Reaction Challenge' },
  'itemization-quiz':  { n: 'D4', t: 'Itemization Quiz' },
  'hero-system':       { n: 'GH1', t: 'Hero System' },
  'tier-lists':        { n: 'GH2', t: 'Tier Lists' },
  'content-creators':  { n: 'GH3', t: 'Content Creators' },
  'faq':               { n: 'GH4', t: 'FAQ' }
};

export const CHAPTER_PATHS = CHAPTER_ORDER.map(ch => `html/${ch}.html`);