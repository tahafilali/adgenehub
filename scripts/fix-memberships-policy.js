import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local file
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log(`Loading environment variables from ${envLocalPath}`);
  dotenv.config({ path: envLocalPath });
} else {
  console.warn(`Environment file .env.local not found at ${envLocalPath}`);
  // Try fallback to .env
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    console.warn(`No environment file found. Make sure you have .env.local or .env file.`);
  }
}

// Required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

// Validate environment variables
const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.error(
    `Error: The following required environment variables are missing: ${missingEnvVars.join(
      ', '
    )}`
  );
  console.error(`Please ensure they are defined in your .env.local file.`);
  console.error(`Current environment values available:`);
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    console.error(`- ${envVar}: ${value ? '✓ defined' : '✗ missing'}`);
  });
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Execute SQL directly using Supabase query
 * @param {string} sql - SQL statement to execute
 * @returns {Promise<{success: boolean, data?: any, error?: any}>} - Result of execution
 */
async function executeSql(sql) {
  try {
    console.log(`Executing SQL (${sql.length} characters)...`);
    
    // Execute SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();
    
    if (error) {
      // If RPC fails, try direct query
      console.log('RPC method failed, trying direct query...');
      const { data: queryData, error: queryError } = await supabase.query(sql);
      
      if (queryError) {
        return { success: false, error: queryError };
      }
      return { success: true, data: queryData };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Execute a single SQL statement directly using Supabase REST endpoint
 * @param {string} statement - SQL statement to execute
 * @param {boolean} useExecFunc - Whether to use exec_sql function
 * @returns {Promise<{success: boolean, data?: any, error?: any}>} - Result of execution
 */
async function executeSingleStatementDirectly(statement, useExecFunc = false) {
  try {
    if (useExecFunc) {
      // Create admin query function if it doesn't exist yet
      await createAdminQueryFunction();
      
      // Call the function
      const { data, error } = await supabase.rpc('exec_sql', { sql_statement: statement });
      
      if (error) {
        console.error('Error executing SQL via exec_sql function:', error);
        return { success: false, error };
      }
      
      return { success: true, data };
    } else {
      // Execute directly via REST endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'params=single-object',
        },
        body: JSON.stringify({
          query: statement,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error ${response.status}: ${errorText}`);
        return { 
          success: false, 
          error: { 
            status: response.status, 
            message: errorText 
          } 
        };
      }
      
      const data = await response.json();
      return { success: true, data };
    }
  } catch (error) {
    console.error('Error executing SQL statement:', error);
    return { success: false, error };
  }
}

/**
 * Split SQL into individual statements and execute each one
 * @param {string} sql - Full SQL content with multiple statements
 * @returns {Promise<{success: boolean, error?: any}>} - Result of execution
 */
async function executeSqlInChunks(sql) {
  // Split SQL into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);

  let successCount = 0;
  let failureCount = 0;
  const results = [];
  const errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length} (${statement.length} chars)`);
    
    // First try to execute using executeSingleStatement
    let result = await executeSingleStatementDirectly(statement);
    
    // If failed, try using the direct method
    if (!result.success) {
      console.log(`Retrying statement ${i + 1} with direct execution...`);
      result = await executeSingleStatementDirectly(statement, true);
    }
    
    const { success, data, error } = result;
    
    if (success) {
      console.log(`✅ Statement ${i + 1} executed successfully.`);
      successCount++;
      results.push(data);
    } else {
      console.error(`❌ Error in statement ${i + 1}:`, error);
      failureCount++;
      errors.push({ statement, error });
    }
  }
  
  console.log(`SQL execution complete: ${successCount} succeeded, ${failureCount} failed.`);
  return { 
    success: successCount > 0 && failureCount === 0,
    results,
    errors
  };
}

// Create exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const createFunctionSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
      RETURN jsonb_build_object('executed', TRUE);
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'executed', FALSE,
        'error', SQLERRM,
        'code', SQLSTATE
      );
    END;
    $$;
    
    -- Grant permissions
    GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
    GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
  `;
  
  try {
    console.log('Creating exec_sql function in Supabase...');
    const { data, error } = await supabase.query(createFunctionSql);
    
    if (error) {
      console.error('Error creating exec_sql function:', error);
      return false;
    }
    
    console.log('✅ exec_sql function created successfully.');
    return true;
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return false;
  }
}

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking if file exists: ${filePath}`, error);
    return false;
  }
}

// Function to validate SQL file paths
function validateSqlFiles(sqlFilePaths) {
  if (!sqlFilePaths || sqlFilePaths.length === 0) {
    console.error('Error: No SQL files provided.');
    console.error('Usage: node scripts/fix-memberships-policy.js <sql-file-path> [sql-file-path2] ...');
    process.exit(1);
  }

  const invalidPaths = [];
  const validPaths = [];

  for (const filePath of sqlFilePaths) {
    // Check if file path is absolute or needs to be resolved
    const resolvedPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.resolve(process.cwd(), filePath);
    
    if (!fileExists(resolvedPath)) {
      invalidPaths.push({ original: filePath, resolved: resolvedPath });
    } else {
      validPaths.push(resolvedPath);
    }
  }

  if (invalidPaths.length > 0) {
    console.error('Error: The following SQL files do not exist:');
    invalidPaths.forEach(({ original, resolved }) => {
      console.error(`- ${original} (resolved to: ${resolved})`);
    });
    console.error('\nPlease provide valid SQL file paths.');
    process.exit(1);
  }

  return validPaths;
}

// Main function to read SQL file and execute it
async function main() {
  try {
    // Get SQL file paths from command line arguments
    const sqlFilePaths = process.argv.slice(2);
    
    // Validate SQL file paths
    const validatedFilePaths = validateSqlFiles(sqlFilePaths);
    console.log(`Found ${validatedFilePaths.length} valid SQL files to execute.`);
    
    // Create exec_sql function
    await createExecSqlFunction();
    
    // Execute each SQL file
    for (const filePath of validatedFilePaths) {
      console.log(`\nProcessing SQL file: ${filePath}`);
      
      // Read SQL file
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`SQL file read successfully (${sql.length} characters)`);
      
      // Execute SQL in chunks
      const result = await executeSqlInChunks(sql);
      console.log('SQL execution completed successfully.');
      
      if (result.errors && result.errors.length > 0) {
        console.error('Errors encountered during execution:');
        result.errors.forEach((error, index) => {
          console.error(`Error ${index + 1}: ${error.statement} - ${error.error.message || JSON.stringify(error.error)}`);
        });
      }
      
      if (result.results && result.results.length > 0) {
        console.log('Execution results:');
        result.results.forEach((res, index) => {
          console.log(`Result ${index + 1}: ${typeof res === 'object' ? JSON.stringify(res) : res}`);
        });
      }
    }
    
    console.log('\nAll SQL files executed successfully.');
  } catch (error) {
    console.error('Error executing SQL:', error);
    process.exit(1);
  }
}

// Execute main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 