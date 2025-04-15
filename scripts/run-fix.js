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
    console.log("Executing SQL...");
    
    // Use the RPC endpoint for executing SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        sql_query: sql
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

// Main function to execute a single SQL file
async function main() {
  // Get the file path from command line arguments
  const filePath = process.argv[2];
  
  if (!filePath) {
    console.error('Please provide a SQL file path');
    console.error('Usage: node scripts/run-fix.js [path/to/file.sql]');
    process.exit(1);
  }
  
  console.log(`Running SQL fix from: ${filePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      process.exit(1);
    }
    
    // Read and execute the SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    const success = await executeSql(sql);
    
    if (success) {
      console.log(`✅ Successfully executed SQL fix from: ${filePath}`);
    } else {
      console.error(`❌ Failed to execute SQL fix from: ${filePath}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error running SQL fix:`, error);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 