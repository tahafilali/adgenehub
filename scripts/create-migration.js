#!/usr/bin/env node

// This script creates a new migration file
// Usage: node scripts/create-migration.js <n>

const fs = require('fs');
const path = require('path');

function createMigrationFile(name) {
  if (!name) {
    console.error('Migration name is required');
    console.log('Usage: npm run migrate:create <n>');
    process.exit(1);
  }

  // Format the name as snake_case
  name = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  // Add timestamp to ensure unique ordering
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  const fileName = `${timestamp}_${name}.sql`;
  
  // Prepare migration SQL template
  const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- Write your SQL migration here
-- For example:
-- CREATE TABLE my_table (id SERIAL PRIMARY KEY, name TEXT);

-- Add Up Migration SQL here

-- Commit the transaction
COMMIT;
`;

  // Create the migration file
  const sqlDir = path.join(__dirname, '..', 'sql');
  
  // Create the sql directory if it doesn't exist
  if (!fs.existsSync(sqlDir)) {
    fs.mkdirSync(sqlDir, { recursive: true });
  }
  
  const filePath = path.join(sqlDir, fileName);
  
  try {
    fs.writeFileSync(filePath, template, 'utf8');
    console.log(`✅ Created migration file: sql/${fileName}`);
  } catch (err) {
    console.error('Error creating migration file:', err);
    process.exit(1);
  }
}

// Get the migration name from command line arguments
const migrationName = process.argv[2];
createMigrationFile(migrationName); 