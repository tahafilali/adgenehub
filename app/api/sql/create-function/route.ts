import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

// POST endpoint to create exec_sql function
export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    
    console.log('Creating exec_sql function in Supabase...');
    
    // SQL to create the exec_sql function
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
    
    // Split SQL into individual statements
    const sqlStatements = createFunctionSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
      .map(stmt => `${stmt};`);
    
    let error = null;
    
    // Execute each statement directly using the REST API
    for (const statement of sqlStatements) {
      try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Prefer': 'params=single-object',
          },
          body: JSON.stringify({
            query: statement,
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error executing statement: ${errorText}`);
          error = new Error(errorText);
          break;
        }
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
        break;
      }
    }
    
    if (error) {
      console.error('Error creating exec_sql function:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
    
    // Test the function by executing a simple query
    const testSql = "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';";
    const { data, error: testError } = await supabase.rpc('exec_sql', { sql_query: testSql });
    
    if (testError) {
      console.error('Function created but test failed:', testError);
      return NextResponse.json({
        success: true,
        test_success: false,
        test_error: testError.message
      });
    }
    
    console.log('exec_sql function created and tested successfully!');
    
    return NextResponse.json({
      success: true,
      test_success: true,
      test_result: data
    });
  } catch (error) {
    console.error('Unexpected error creating exec_sql function:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 