import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Execute SQL using Supabase client and rpc
async function executeSql(sql) {
  try {
    console.log(`Executing SQL (${sql.length} characters)...`);
    
    // Use the Supabase client's rpc function to call exec_sql if it exists
    // or fallback to direct query execution
    try {
      // First, try to execute the SQL directly with a prepared statement
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        throw error;
      }
      
      console.log("SQL execution successful via rpc");
      return true;
    } catch (rpcError) {
      console.log("RPC method failed or not available, trying direct query");
      
      // If the rpc method fails, try a direct query
      const { data, error } = await supabase.auth.admin.createClient();
      
      if (error) {
        throw error;
      }
      
      const { data: queryData, error: queryError } = await data.connection.from('dummy').select('*').limit(1);
      if (queryError) {
        throw queryError;
      }
      
      // Since we can query successfully, try to create the exec_sql function first
      const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      const { data: createData, error: createError } = await data.connection.realtime.sql(createFunctionSql);
      if (createError) {
        console.warn("Could not create exec_sql function:", createError);
      } else {
        console.log("Created exec_sql function");
        
        // Try using the newly created function
        const { data: execData, error: execError } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (execError) {
          throw execError;
        }
        
        console.log("SQL execution successful via newly created rpc");
        return true;
      }
      
      // If all else fails, try to execute SQL directly through a raw query
      // This may not work for all SQL statements but is a fallback
      const { data: rawResult, error: rawError } = await data.connection.realtime.sql(sql);
      if (rawError) {
        throw rawError;
      }
      
      console.log("SQL execution successful via raw query");
      return true;
    }
  } catch (error) {
    console.error('SQL execution error:', error);
    return false;
  }
}

// Main function to execute SQL files
async function main() {
  console.log('Executing SQL files using Supabase client...');
  
  // Get file to execute from command line arguments
  const sqlFilePath = process.argv[2];
  
  if (!sqlFilePath) {
    console.error('Please provide an SQL file path as a command line argument.');
    process.exit(1);
  }
  
  const fullPath = path.resolve(process.cwd(), sqlFilePath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.error(`File does not exist: ${fullPath}`);
    process.exit(1);
  }
  
  console.log(`Executing SQL from file: ${fullPath}`);
  
  try {
    // Read and execute the SQL file
    const sql = fs.readFileSync(fullPath, 'utf8');
    const success = await executeSql(sql);
    
    if (success) {
      console.log(`✅ Successfully executed SQL from: ${sqlFilePath}`);
    } else {
      console.error(`❌ Failed to execute SQL from: ${sqlFilePath}`);
      
      // Display SQL for manual execution
      console.log('\nYou can run this SQL manually in the SQL Editor:');
      console.log('--------------------------------------------------');
      console.log(sql);
      console.log('--------------------------------------------------\n');
      
      process.exit(1);
    }
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 