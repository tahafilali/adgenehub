import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fetch from 'node-fetch';

// ES module replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
config({ path: '.env.local' });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Execute a single SQL statement directly via REST API
async function executeStatement(statement) {
  if (!statement.trim()) return true;
  
  console.log(`Executing statement: ${statement.substring(0, 50)}...`);
  
  try {
    // Direct SQL endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        query: statement
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response (${response.status}):`, errorText);
      return false;
    }
    
    console.log(`✅ Statement executed successfully`);
    return true;
  } catch (error) {
    console.error('Unexpected error executing statement:', error);
    return false;
  }
}

// Split SQL file into individual statements
function parseStatements(sql) {
  // Simple split by semicolon, but skip semicolons in quotes or comments
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let inComment = false;
  let escaped = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';
    
    // Handle comment start
    if (!inString && !inComment && char === '-' && nextChar === '-') {
      inComment = 'line';
      currentStatement += char;
      continue;
    }
    
    // Handle comment end for line comments
    if (inComment === 'line' && (char === '\n' || char === '\r')) {
      inComment = false;
      currentStatement += char;
      continue;
    }
    
    // Handle block comment start
    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inComment = 'block';
      currentStatement += char;
      continue;
    }
    
    // Handle block comment end
    if (inComment === 'block' && char === '*' && nextChar === '/') {
      inComment = false;
      currentStatement += char + nextChar;
      i++; // Skip next char
      continue;
    }
    
    // Handle string quotes
    if (!inComment && char === "'" && !escaped) {
      inString = !inString;
      currentStatement += char;
      continue;
    }
    
    // Handle escape character
    if (inString && char === '\\' && !escaped) {
      escaped = true;
      currentStatement += char;
      continue;
    } else {
      escaped = false;
    }
    
    // Add to current statement
    currentStatement += char;
    
    // If semicolon outside string and comment, end statement
    if (char === ';' && !inString && !inComment) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // Add the last statement if not empty
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(stmt => stmt.trim() !== '');
}

// Process an SQL file
async function processSqlFile(filePath) {
  console.log(`Processing SQL file: ${path.basename(filePath)}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // For direct SQL execution, send the whole file at once
    const success = await executeStatement(sql);
    
    if (!success) {
      console.error(`Failed to execute SQL file: ${path.basename(filePath)}`);
      return false;
    }
    
    console.log(`✅ Successfully processed ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`Error processing SQL file ${path.basename(filePath)}:`, error);
    return false;
  }
}

// Main function to execute SQL files
async function main() {
  console.log('Applying database schema changes to remote Supabase...');
  
  // Files to execute in specific order
  const files = [
    'create_campaigns_table.sql',
    'create_ads_table.sql',
    'create_templates_table.sql'
  ];
  
  // Track failed files
  const failed = [];
  
  // Execute each SQL file in order
  for (const file of files) {
    try {
      const filePath = path.join(__dirname, '../sql', file);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`File does not exist: ${filePath}`);
        continue;
      }
      
      const success = await processSqlFile(filePath);
      
      if (!success) {
        console.error(`❌ Failed to process: ${file}`);
        
        // Get SQL content for manual execution
        const sql = fs.readFileSync(filePath, 'utf8');
        failed.push({ file, sql });
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      
      // Get SQL content for manual execution
      const filePath = path.join(__dirname, '../sql', file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      failed.push({ file, sql });
    }
  }
  
  // Print failed migrations for manual execution
  if (failed.length > 0) {
    console.log('\nSome SQL files failed to execute. You may need to run them manually in the SQL Editor.');
    
    for (const { file, sql } of failed) {
      console.log(`❌ Failed to apply: ${file}\n`);
      console.log('You can run this SQL manually in the SQL Editor:');
      console.log('--------------------------------------------------');
      console.log(sql);
      console.log('--------------------------------------------------\n');
    }
  } else {
    console.log('\n✅ All SQL files executed successfully.');
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 