import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your environment variables');
  process.exit(1);
}

async function executeSql(sqlContent, filename) {
  try {
    console.log(`Executing ${filename}...`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sql_query: sqlContent
      })
    });
    
    const result = await response.text();
    
    if (!response.ok) {
      console.error(`Error executing ${filename}:`, result);
      return false;
    }
    
    console.log(`Successfully executed ${filename}`);
    return true;
  } catch (error) {
    console.error(`Failed to execute ${filename}:`, error);
    return false;
  }
}

async function main() {
  console.log("Directly executing SQL files using Supabase API...");
  
  // First create the exec_sql function
  const execSqlFunctionPath = path.join(__dirname, '..', 'sql', 'create_exec_function.sql');
  if (fs.existsSync(execSqlFunctionPath)) {
    console.log("Creating the exec_sql function in Supabase...");
    const execSqlContent = fs.readFileSync(execSqlFunctionPath, 'utf8');
    
    // Try to create the exec_sql function using the REST API directly
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: execSqlContent
      })
    });
    
    if (!response.ok) {
      console.error("Could not create exec_sql function. You may need to execute this manually in the SQL editor.");
      console.log(execSqlContent);
    } else {
      console.log("Successfully created exec_sql function.");
    }
  }
  
  // List of SQL files to execute, skipping the ones that are already created
  const sqlFiles = [
    // 'create_users_table.sql', // Already exists
    // 'create_campaigns_table.sql', // Already exists
    'create_ads_table.sql',
    'create_templates_table.sql'
  ];
  
  const sqlDir = path.join(__dirname, '..', 'sql');
  
  let anyFailed = false;
  
  for (const file of sqlFiles) {
    const filePath = path.join(sqlDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`SQL file not found: ${filePath}`);
      continue;
    }
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const success = await executeSql(sqlContent, file);
    
    if (success) {
      console.log(`✅ Successfully applied: ${file}`);
    } else {
      console.error(`❌ Failed to apply: ${file}`);
      anyFailed = true;
      
      // If a file fails, print its content so it can be manually executed
      console.log("\nYou can run this SQL manually in the SQL Editor:");
      console.log("--------------------------------------------------");
      console.log(sqlContent);
      console.log("--------------------------------------------------\n");
    }
  }
  
  if (anyFailed) {
    console.log("\nSome SQL files failed to execute. You may need to run them manually in the SQL Editor.");
  } else {
    console.log("\nAll SQL files executed successfully!");
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 