#!/usr/bin/env node

// This script runs SQL migrations against the Supabase database
// Usage: node scripts/apply-migrations.js <filename.sql>

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Execute SQL directly via Supabase PostgreSQL REST API
async function executeSql(sql) {
  try {
    // Use the SQL API endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`PostgreSQL execution failed: ${response.status} - ${errorData}`);
    }

    return true;
  } catch (error) {
    console.error('SQL execution error:', error);
    return false;
  }
}

// Create migrations tracking table if it doesn't exist
async function ensureMigrationsTable() {
  console.log('Ensuring migrations tracking table exists...');
  
  // SQL to create the migrations table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `;
  
  const success = await executeSql(createTableSQL);
  
  if (!success) {
    throw new Error('Failed to create migrations table');
  }
  
  console.log('Migrations table ready.');
}

// Get list of already applied migrations
async function getAppliedMigrations() {
  const { data, error } = await supabase
    .from('migrations')
    .select('name')
    .order('applied_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching applied migrations:', error);
    throw error;
  }
  
  return data ? data.map(row => row.name) : [];
}

// Run a single SQL migration file
async function runMigration(filePath) {
  console.log(`Running migration: ${path.basename(filePath)}`);
  
  try {
    // Read the SQL file content
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Execute the SQL through direct SQL execution
    const success = await executeSql(sql);
    
    if (!success) {
      console.error(`Error executing migration ${path.basename(filePath)}`);
      throw new Error('SQL execution failed');
    }
    
    // Record that this migration has been applied
    const { error: recordError } = await supabase
      .from('migrations')
      .insert({ name: path.basename(filePath) });
    
    if (recordError) {
      console.error(`Error recording migration ${path.basename(filePath)}:`, recordError);
      throw recordError;
    }
    
    console.log(`Migration successful: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Migration failed: ${path.basename(filePath)}`, error);
    return false;
  }
}

// Main function to apply migrations
async function main() {
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log('Already applied migrations:', appliedMigrations.length);
    
    // Check if a specific file was provided
    const specificFile = process.argv[2];
    
    if (specificFile) {
      // Run just the specific file
      console.log(`Running specific migration: ${specificFile}`);
      
      // Determine the path based on whether it's a relative or absolute path
      const filePath = path.isAbsolute(specificFile) 
        ? specificFile 
        : path.resolve(process.cwd(), specificFile);
      
      if (!fs.existsSync(filePath)) {
        console.error(`File does not exist: ${filePath}`);
        process.exit(1);
      }
      
      const success = await runMigration(filePath);
      
      if (!success) {
        console.error(`Migration ${specificFile} failed.`);
        process.exit(1);
      }
      
      console.log('Migration completed successfully!');
      return;
    }
    
    // Default directory is "sql"
    const migrationsDir = path.resolve(__dirname, '../sql');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log(`Migration directory does not exist: ${migrationsDir}`);
      console.log('No migrations to apply');
      return;
    }
    
    // Get all SQL files from migrations directory
    let migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure proper order (timestamp-based filenames)
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Filter out already applied migrations
    const pendingMigrations = migrationFiles.filter(
      file => !appliedMigrations.includes(file)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No new migrations to apply');
      return;
    }
    
    console.log(`Applying ${pendingMigrations.length} pending migrations`);
    
    // Apply each pending migration
    for (const file of pendingMigrations) {
      const filePath = path.join(migrationsDir, file);
      const success = await runMigration(filePath);
      
      if (!success) {
        console.error(`Migration ${file} failed. Stopping further migrations.`);
        process.exit(1);
      }
    }
    
    console.log('All pending migrations applied successfully!');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

// Run the migration process
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 