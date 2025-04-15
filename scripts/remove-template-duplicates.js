import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

// Execute SQL directly
async function executeSql(sql) {
  try {
    // Use the REST SQL endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'resolution=ignore-duplicates,return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SQL error: ${response.status} - ${errorText}`);
      return { success: false, error: errorText };
    } else {
      return { success: true };
    }
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error: error.message };
  }
}

// Remove duplicate templates from the templates table using SQL Common Table Expressions
async function removeTemplateDuplicates() {
  // First, let's get a count of all templates
  const { data: beforeCount, error: beforeError } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true });
  
  if (beforeError) {
    console.error('Error getting template count:', beforeError);
    return { success: false, error: beforeError.message };
  }
  
  console.log(`Before cleanup: Found ${beforeCount.count} templates in the database`);
  
  // Find duplicate templates based on name and tier
  const findDuplicatesSql = `
    WITH duplicates AS (
      SELECT 
        id,
        name,
        tier,
        ROW_NUMBER() OVER (PARTITION BY name, tier ORDER BY created_at) as row_num
      FROM templates
    )
    SELECT id FROM duplicates WHERE row_num > 1;
  `;
  
  try {
    // First try to find duplicates using the Supabase JS client
    const { data: duplicates, error: duplicatesError } = await supabase.rpc(
      'exec_sql',
      { sql_query: findDuplicatesSql }
    ).select();
    
    if (duplicatesError && duplicatesError.message !== 'Not found') {
      console.error('Error finding duplicates with RPC:', duplicatesError);
      
      // Try direct SQL execution as fallback
      console.log('Trying direct SQL execution to find duplicates...');
      
      // Create a temporary table to store duplicate IDs
      const createTempTableSql = `
        CREATE TEMP TABLE IF NOT EXISTS temp_duplicate_templates (id UUID PRIMARY KEY);
        
        INSERT INTO temp_duplicate_templates (id)
        WITH duplicates AS (
          SELECT 
            id,
            name,
            tier,
            ROW_NUMBER() OVER (PARTITION BY name, tier ORDER BY created_at) as row_num
          FROM templates
        )
        SELECT id FROM duplicates WHERE row_num > 1;
      `;
      
      const tempTableResult = await executeSql(createTempTableSql);
      if (!tempTableResult.success) {
        console.error('Failed to create temporary table:', tempTableResult.error);
        return { success: false, error: 'Failed to find duplicates' };
      }
      
      // Get the duplicate IDs from the temp table
      const { data: tempDuplicates, error: tempError } = await supabase.rpc(
        'exec_sql',
        { sql_query: 'SELECT * FROM temp_duplicate_templates' }
      ).select();
      
      if (tempError) {
        console.error('Error getting duplicates from temp table:', tempError);
        return { success: false, error: 'Failed to retrieve duplicates' };
      }
      
      // Delete the duplicates
      let deleteCount = 0;
      if (tempDuplicates && tempDuplicates.length > 0) {
        const duplicateIds = tempDuplicates.map(row => row.id);
        console.log(`Found ${duplicateIds.length} duplicate templates`);
        
        // Delete duplicates in batches to avoid query size limits
        const batchSize = 50;
        for (let i = 0; i < duplicateIds.length; i += batchSize) {
          const batch = duplicateIds.slice(i, i + batchSize);
          const { error: deleteError } = await supabase
            .from('templates')
            .delete()
            .in('id', batch);
          
          if (deleteError) {
            console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError);
          } else {
            deleteCount += batch.length;
            console.log(`Deleted batch ${i / batchSize + 1} (${batch.length} templates)`);
          }
        }
      } else {
        console.log('No duplicate templates found');
      }
      
      // Drop the temp table
      await executeSql('DROP TABLE IF EXISTS temp_duplicate_templates');
      
      // Get the final count
      const { data: afterCount, error: afterError } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true });
      
      if (afterError) {
        console.error('Error getting template count after cleanup:', afterError);
      } else {
        console.log(`After cleanup: ${afterCount.count} templates remaining in the database`);
        console.log(`Removed ${beforeCount.count - afterCount.count} duplicate templates`);
      }
      
      return { 
        success: true, 
        removedCount: deleteCount,
        beforeCount: beforeCount.count,
        afterCount: afterCount ? afterCount.count : null
      };
    } else {
      // Process duplicates if found using RPC
      let deleteCount = 0;
      if (duplicates && duplicates.length > 0) {
        const duplicateIds = duplicates.map(row => row.id);
        console.log(`Found ${duplicateIds.length} duplicate templates`);
        
        // Delete duplicates in batches to avoid query size limits
        const batchSize = 50;
        for (let i = 0; i < duplicateIds.length; i += batchSize) {
          const batch = duplicateIds.slice(i, i + batchSize);
          const { error: deleteError } = await supabase
            .from('templates')
            .delete()
            .in('id', batch);
          
          if (deleteError) {
            console.error(`Error deleting batch ${i / batchSize + 1}:`, deleteError);
          } else {
            deleteCount += batch.length;
            console.log(`Deleted batch ${i / batchSize + 1} (${batch.length} templates)`);
          }
        }
      } else {
        console.log('No duplicate templates found');
      }
      
      // Get the final count
      const { data: afterCount, error: afterError } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true });
      
      if (afterError) {
        console.error('Error getting template count after cleanup:', afterError);
      } else {
        console.log(`After cleanup: ${afterCount.count} templates remaining in the database`);
        console.log(`Removed ${beforeCount.count - afterCount.count} duplicate templates`);
      }
      
      return { 
        success: true, 
        removedCount: deleteCount,
        beforeCount: beforeCount.count,
        afterCount: afterCount ? afterCount.count : null
      };
    }
  } catch (error) {
    console.error('Error in remove duplicates process:', error);
    return { success: false, error: error.message };
  }
}

// Alternative approach: Use direct SQL to remove duplicates
async function removeTemplateDirectSQL() {
  console.log('Using direct SQL to remove duplicate templates...');
  
  const removeDuplicatesSql = `
    -- Create a temporary table with unique rows and row numbers
    CREATE TEMP TABLE unique_templates AS
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name, tier ORDER BY created_at) as row_num
    FROM templates;
    
    -- Delete all rows that are duplicates (row_num > 1)
    DELETE FROM templates
    WHERE id IN (
      SELECT id FROM unique_templates WHERE row_num > 1
    );
    
    -- Drop the temporary table
    DROP TABLE unique_templates;
  `;
  
  const result = await executeSql(removeDuplicatesSql);
  
  if (result.success) {
    console.log('Successfully executed duplicate removal SQL');
    
    // Get the current count
    const { data: afterCount, error: afterError } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true });
    
    if (afterError) {
      console.error('Error getting template count after cleanup:', afterError);
    } else {
      console.log(`After cleanup: ${afterCount.count} templates remaining in the database`);
    }
    
    return { success: true };
  } else {
    console.error('Failed to remove duplicates with direct SQL:', result.error);
    return { success: false, error: result.error };
  }
}

// Main function
async function main() {
  console.log('Starting template duplicate removal process...');
  
  // First try the standard approach
  const result = await removeTemplateDuplicates();
  
  if (!result.success) {
    console.log('First approach failed, trying alternative direct SQL approach...');
    
    // Try the direct SQL approach as fallback
    const directResult = await removeTemplateDirectSQL();
    
    if (directResult.success) {
      console.log('Successfully removed duplicate templates using direct SQL');
    } else {
      console.error('All approaches failed to remove duplicate templates');
      console.log('\nPlease run the following SQL manually in the SQL Editor:');
      console.log(`
        -- Delete duplicate templates, keeping the oldest one
        DELETE FROM templates
        WHERE id IN (
          SELECT id
          FROM (
            SELECT id,
              ROW_NUMBER() OVER (PARTITION BY name, tier ORDER BY created_at) as row_num
            FROM templates
          ) t
          WHERE t.row_num > 1
        );
      `);
    }
  } else {
    console.log(`Successfully removed ${result.removedCount} duplicate templates`);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 