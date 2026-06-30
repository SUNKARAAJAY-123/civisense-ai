import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const required = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
};

const placeholders = new Set([
  'your-supabase-secret-key',
  'your-supabase-anon-or-publishable-key',
  'https://your-project.supabase.co',
]);

let failed = false;

for (const [name, value] of Object.entries(required)) {
  if (!value || placeholders.has(value)) {
    console.error(`Missing or placeholder value: ${name}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

if (required.SUPABASE_SECRET_KEY?.startsWith('sb_publishable_')) {
  console.warn('SUPABASE_SECRET_KEY is currently a publishable key. Backend writes may fail; use an sb_secret_ key on the backend.');
}

const supabase = createClient(required.SUPABASE_URL, required.SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { data, error } = await supabase.from('profiles').select('id').limit(1);

if (error) {
  console.error('Supabase connection check failed.');
  console.error(`Reason: ${error.message}`);

  if (error.message.includes("Could not find the table 'public.profiles'")) {
    console.error('Fix: run src/database/schema.sql in the Supabase SQL Editor, then run npm run check:supabase again.');
  }

  if (error.message.includes('permission denied for table profiles')) {
    console.error('Fix: run src/database/fix-permissions.sql in the Supabase SQL Editor, then run npm run check:supabase again.');
  }

  process.exit(1);
}

console.log('Supabase connected successfully.');
console.log(`profiles query returned ${data.length} row(s).`);
