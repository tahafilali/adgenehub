import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';

// POST endpoint to create templates table
export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    
    console.log('Creating templates table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'sql', 'create_templates_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
      .map(statement => statement + ';');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          errorCount++;
          errors.push({
            statement: i + 1,
            error: error.message
          });
          
          // Try direct query if RPC fails
          console.log('Trying direct query execution...');
          const { error: directError } = await supabase.query(statement);
          
          if (!directError) {
            // If direct query succeeds, count it as a success
            console.log(`Statement ${i + 1} executed successfully via direct query`);
            successCount++;
            errors.pop(); // Remove the error we just added
          } else {
            console.error(`Direct query also failed:`, directError);
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (error) {
        console.error(`Unexpected error executing statement ${i + 1}:`, error);
        errorCount++;
        errors.push({
          statement: i + 1,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      success: successCount > 0,
      statistics: {
        total: statements.length,
        successful: successCount,
        failed: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Unexpected error creating templates table:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 