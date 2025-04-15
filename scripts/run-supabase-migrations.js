#!/usr/bin/env node

// This script runs Supabase migrations against a local or remote Supabase instance
// Usage: node scripts/run-supabase-migrations.js

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Running Supabase migrations...');

try {
  // Check if supabase CLI is installed
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI found');
  } catch (err) {
    console.error('❌ Supabase CLI not found. Please install it first:');
    console.error('npm install -g supabase');
    console.error('Error details:', err.message);
    process.exit(1);
  }

  // Check if supabase directory exists
  const supabaseDir = path.join(__dirname, '..', 'supabase');
  if (!fs.existsSync(supabaseDir)) {
    console.error('❌ Supabase directory not found. Please run:');
    console.error('supabase init');
    process.exit(1);
  }

  // Check migrations directory
  const migrationsDir = path.join(supabaseDir, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found.');
    fs.mkdirSync(migrationsDir, { recursive: true });
    console.log('✅ Created migrations directory');
  }

  // Check if there are any migrations
  const migrations = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
  if (migrations.length === 0) {
    console.log('No migrations found. Create one with:');
    console.log('npm run supabase:migration:new my_migration_name');
    process.exit(0);
  }

  console.log(`Found ${migrations.length} migrations:`);
  migrations.forEach(migration => {
    console.log(`- ${migration}`);
  });

  // Run migrations
  console.log('\nApplying migrations to remote database...');
  
  // For development environment
  const isDevMode = process.argv.includes('--local');
  
  if (isDevMode) {
    try {
      console.log('Running migrations on local database...');
      execSync('supabase db reset', { stdio: 'inherit' });
      console.log('✅ Migrations applied successfully to local database');
    } catch (err) {
      console.error('❌ Failed to apply migrations to local database');
      console.error(err.toString());
      process.exit(1);
    }
  } else {
    // For production, push changes to the remote database
    try {
      console.log('Pushing migrations to remote database...');
      // Include the --include-all flag to apply all migrations including those that might be out of order
      execSync('supabase db push --include-all', { stdio: 'inherit' });
      console.log('✅ Migrations pushed successfully to remote database');
    } catch (err) {
      console.error('❌ Failed to push migrations to remote database');
      console.error(err.toString());
      process.exit(1);
    }
  }
  
} catch (err) {
  console.error('Unexpected error:', err);
  process.exit(1);
} 