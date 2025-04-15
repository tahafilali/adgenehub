import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    const supabase = createSupabaseAdmin();
    
    // Get all ads or filter by campaign ID
    let query = supabase.from('ads').select('*');
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    const { data: ads, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching ads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Try using SQL query to fetch ads directly
    let sqlData = null;
    let sqlError = null;
    
    try {
      const sql = campaignId 
        ? `SELECT * FROM ads WHERE campaign_id = '${campaignId}' ORDER BY created_at DESC;` 
        : `SELECT * FROM ads ORDER BY created_at DESC LIMIT 10;`;
      
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (!error) {
        sqlData = data;
      } else {
        sqlError = error;
      }
    } catch (e) {
      sqlError = e instanceof Error ? e.message : String(e);
    }
    
    return NextResponse.json({
      message: `Found ${ads?.length || 0} ads`,
      count: ads?.length || 0,
      ads: ads || [],
      sqlQuery: {
        success: !sqlError,
        data: sqlData,
        error: sqlError
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