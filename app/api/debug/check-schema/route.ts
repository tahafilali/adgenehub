import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    
    // Check if the ads table exists
    const tableCheckSql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'ads'
      ) as table_exists;
    `;
    
    const { data: tableExists, error: tableError } = await supabase
      .rpc('exec_sql', { sql_query: tableCheckSql });
    
    // Get the structure of the ads table
    const structureSql = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ads'
      ORDER BY ordinal_position;
    `;
    
    const { data: structure, error: structureError } = await supabase
      .rpc('exec_sql', { sql_query: structureSql });
    
    // Count existing ads
    const countSql = `SELECT COUNT(*) FROM ads;`;
    const { data: count, error: countError } = await supabase
      .rpc('exec_sql', { sql_query: countSql });
    
    // Check for existing triggers on the ads table
    const triggersSql = `
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'ads';
    `;
    
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', { sql_query: triggersSql });
    
    // Check the Row Level Security policies on the ads table
    const policiesSql = `
      SELECT tablename, policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'ads';
    `;
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { sql_query: policiesSql });
    
    // Create a simple ad to test the table
    const testSql = `
      INSERT INTO ads (
        id, campaign_id, user_id, content, status, impressions, clicks, conversions, is_selected
      ) VALUES (
        gen_random_uuid(), 
        '198b71dc-d98a-4529-b749-ff7387db15be', 
        '4df040f3-050e-49ca-afa2-e36de3f7fa0e',
        'Test ad created by diagnostic tool',
        'draft',
        0, 0, 0, false
      ) RETURNING id;
    `;
    
    const { data: testInsert, error: testError } = await supabase
      .rpc('exec_sql', { sql_query: testSql });
    
    // Apply schema fixes if needed
    let fixesApplied = false;
    let fixResults = null;
    
    // If created_at or updated_at are causing issues (null constraint), fix them
    if (structure && Array.isArray(structure.executed)) {
      const columns = structure.executed;
      const hasCreatedAt = columns.some((col: { column_name: string }) => col.column_name === 'created_at');
      const hasUpdatedAt = columns.some((col: { column_name: string }) => col.column_name === 'updated_at');
      
      if (hasCreatedAt || hasUpdatedAt) {
        // Fix the timestamp columns to have proper defaults and allow null
        const fixSql = `
          BEGIN;
          
          -- Modify created_at column if it exists
          ${hasCreatedAt ? `
          ALTER TABLE ads ALTER COLUMN created_at DROP NOT NULL;
          ALTER TABLE ads ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
          UPDATE ads SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
          ` : ''}
          
          -- Modify updated_at column if it exists
          ${hasUpdatedAt ? `
          ALTER TABLE ads ALTER COLUMN updated_at DROP NOT NULL;
          ALTER TABLE ads ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
          UPDATE ads SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
          ` : ''}
          
          -- Fix RLS policies
          ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
          
          -- Remove potentially problematic policies
          DROP POLICY IF EXISTS "Users can read own ads" ON ads;
          DROP POLICY IF EXISTS "Users can insert own ads" ON ads;
          DROP POLICY IF EXISTS "Users can update own ads" ON ads;
          DROP POLICY IF EXISTS "Users can delete own ads" ON ads;
          
          -- Create simplified comprehensive policies
          CREATE POLICY "Users can read own ads" ON ads FOR SELECT USING (auth.uid() = user_id);
          CREATE POLICY "Users can manage own ads" ON ads FOR ALL USING (auth.uid() = user_id);
          CREATE POLICY "Service role full access" ON ads FOR ALL USING (auth.role() = 'service_role');
          
          COMMIT;
        `;
        
        const { data: fixData, error: fixError } = await supabase
          .rpc('exec_sql', { sql_query: fixSql });
        
        fixesApplied = true;
        fixResults = { data: fixData, error: fixError };
      }
    }
    
    return NextResponse.json({
      table: {
        exists: tableExists?.executed,
        error: tableError
      },
      structure: {
        columns: structure?.executed,
        error: structureError
      },
      count: {
        value: count?.executed,
        error: countError
      },
      triggers: {
        data: triggers?.executed,
        error: triggersError
      },
      policies: {
        data: policies?.executed,
        error: policiesError
      },
      test: {
        insertId: testInsert?.executed,
        error: testError
      },
      fixes: {
        applied: fixesApplied,
        results: fixResults
      }
    });
  } catch (error) {
    console.error('Error in schema check:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 