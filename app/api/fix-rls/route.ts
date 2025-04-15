import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'sql', 'fix_ads_rls.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
      .map(statement => statement + ';');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    const results = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      
      // Skip comments-only statements
      if (statement.trim().startsWith('--')) {
        console.log('Skipping comment-only statement');
        results.push({ index: i, status: 'skipped', message: 'Comment only' });
        continue;
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          results.push({ 
            index: i, 
            status: 'error', 
            error: error.message,
            statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
          });
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
          results.push({ 
            index: i, 
            status: 'success',
            data: data,
            statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
          });
        }
      } catch (error) {
        console.error(`Unexpected error executing statement ${i + 1}:`, error);
        results.push({ 
          index: i, 
          status: 'error', 
          error: error instanceof Error ? error.message : String(error),
          statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : '')
        });
      }
    }
    
    // Try to fetch ads after fixing policies
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('campaign_id', '198b71dc-d98a-4529-b749-ff7387db15be');
    
    return NextResponse.json({
      message: 'RLS policies updated',
      executed: results,
      adsCheck: {
        count: ads?.length || 0,
        error: adsError ? adsError.message : null
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 