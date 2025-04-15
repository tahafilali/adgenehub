const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Execute SQL directly via Supabase PostgreSQL REST API
async function executeSql(sql) {
  try {
    // Use the SQL API endpoint directly
    // Documentation: https://supabase.com/docs/reference/api/sql-api
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

    console.log("SQL execution successful");
    return true;
  } catch (error) {
    console.error('SQL execution error:', error);
    return false;
  }
}

// Main function to execute SQL files
async function main() {
  console.log('Directly executing SQL files using Supabase SQL API...');

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
    console.log(`Executing ${file}...`);
    
    try {
      const filePath = path.join(__dirname, '../sql', file);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn(`File does not exist: ${filePath}`);
        continue;
      }
      
      const sql = fs.readFileSync(filePath, 'utf8');
      const success = await executeSql(sql);
      
      if (success) {
        console.log(`✅ Successfully executed: ${file}`);
      } else {
        console.error(`❌ Failed to execute: ${file}`);
        failed.push({
          file,
          sql
        });
      }
    } catch (error) {
      console.error(`Failed to execute ${file}:`, error);
      
      // Get SQL content for manual execution
      const filePath = path.join(__dirname, '../sql', file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      failed.push({
        file,
        sql
      });
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