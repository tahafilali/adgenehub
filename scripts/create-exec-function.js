import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Create the exec_sql function
async function createExecFunction() {
  try {
    // SQL to create or replace the exec_sql function
    const sql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS VOID AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
    GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
    
    -- Comment on function
    COMMENT ON FUNCTION exec_sql IS 'Execute arbitrary SQL (use with caution)';
    `;
    
    // Save SQL to a file
    const sqlFilePath = path.resolve(__dirname, '../sql/create_exec_function.sql');
    fs.writeFileSync(sqlFilePath, sql);
    console.log(`Saved SQL to: ${sqlFilePath}`);
    
    // Execute SQL using Postgres adapter for more direct access
    // Using raw query capabilities
    const { data, error } = await supabase
      .from('_schema')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error executing test query:', error);
      return false;
    }
    
    // Create a function to break up the SQL and execute it statement by statement
    async function executeStatements(sql) {
      // Split by semicolons, and filter out empty statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        try {
          console.log(`Executing: ${statement}`);
          
          // Use the REST SQL endpoint directly
          const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              query: statement
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`SQL error: ${response.status} - ${errorText}`);
          } else {
            console.log('Statement executed successfully');
          }
        } catch (stmtError) {
          console.error(`Error executing statement: ${stmtError}`);
        }
      }
    }
    
    // Try executing the SQL
    await executeStatements(sql);
    
    // Now try to use the function we just created
    try {
      console.log('Testing the exec_sql function...');
      const testSql = 'SELECT COUNT(*) FROM information_schema.tables';
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: testSql
      });
      
      if (error) {
        console.error('exec_sql function test failed:', error);
        return false;
      }
      
      console.log('exec_sql function created and tested successfully!');
      return true;
    } catch (testError) {
      console.error('Error testing exec_sql function:', testError);
      return false;
    }
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('Creating exec_sql function in Supabase...');
  
  const success = await createExecFunction();
  
  if (success) {
    console.log('✅ Successfully created the exec_sql function.');
    console.log('You can now use this function to execute SQL statements via RPC.');
  } else {
    console.error('❌ Failed to create exec_sql function.');
    console.log('\nYou may need to create this function manually in the SQL Editor.');
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 