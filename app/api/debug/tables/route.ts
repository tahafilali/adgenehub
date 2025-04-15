import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    
    // Get table structure information
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            table_name,
            column_name,
            data_type,
            is_nullable
          FROM 
            information_schema.columns
          WHERE 
            table_schema = 'public'
            AND table_name IN ('ads', 'campaigns', 'templates')
          ORDER BY
            table_name, ordinal_position;
        `
      });
    
    if (tableError) {
      console.error('Error fetching table structure:', tableError);
      
      // Try direct query instead
      const { data: directData, error: directError } = await supabase
        .rpc('exec_sql', { 
          sql_query: `
            SELECT 
              table_name,
              column_name,
              data_type,
              is_nullable
            FROM 
              information_schema.columns
            WHERE 
              table_schema = 'public'
              AND table_name IN ('ads', 'campaigns', 'templates')
            ORDER BY
              table_name, ordinal_position;
          `
        });
      
      if (directError) {
        return NextResponse.json({ 
          error: 'Failed to fetch table structure',
          details: directError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        message: 'Database structure retrieved with direct query',
        tables: directData
      });
    }
    
    // Try to create a test ad to see where it fails
    const adData = {
      campaign_id: '198b71dc-d98a-4529-b749-ff7387db15be', // Your campaign ID
      user_id: '4df040f3-050e-49ca-afa2-e36de3f7fa0e', // Your user ID
      content: 'Test ad for debugging',
      status: 'draft',
      impressions: 0,
      clicks: 0,
      conversions: 0,
      is_selected: false
    };
    
    const { data: testAd, error: adError } = await supabase
      .from('ads')
      .insert(adData)
      .select();
    
    return NextResponse.json({ 
      message: 'Database structure retrieved',
      tables: tableInfo,
      testAdResult: {
        success: !adError,
        data: testAd,
        error: adError
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