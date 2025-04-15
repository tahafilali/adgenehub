import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    const campaignId = '198b71dc-d98a-4529-b749-ff7387db15be';
    const userId = '4df040f3-050e-49ca-afa2-e36de3f7fa0e';
    
    // 1. Check if the ads table exists and has the right structure
    const tableCheckSql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ads'
      ) as table_exists;
    `;
    
    const { data: tableCheck, error: tableCheckError } = await supabase
      .rpc('exec_sql', { sql_query: tableCheckSql });
    
    if (tableCheckError) {
      return NextResponse.json({
        error: 'Failed to check if ads table exists',
        details: tableCheckError.message
      }, { status: 500 });
    }
    
    // 2. Check the table structure
    const tableStructureSql = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'ads';
    `;
    
    const { data: tableStructure, error: tableStructureError } = await supabase
      .rpc('exec_sql', { sql_query: tableStructureSql });
    
    // 3. Create a test ad to verify insertion works
    const testId = crypto.randomUUID();
    const testContent = `Test ad created on ${new Date().toISOString()}`;
    
    const insertSql = `
      INSERT INTO ads (
        id, campaign_id, user_id, content, 
        status, impressions, clicks, conversions, is_selected
      ) VALUES (
        '${testId}', '${campaignId}', '${userId}', '${testContent}',
        'draft', 0, 0, 0, false
      ) RETURNING *;
    `;
    
    const { data: insertResult, error: insertError } = await supabase
      .rpc('exec_sql', { sql_query: insertSql });
    
    // 4. Check for RLS policies
    const rlsPoliciesSql = `
      SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'ads';
    `;
    
    const { data: rlsPolicies, error: rlsPoliciesError } = await supabase
      .rpc('exec_sql', { sql_query: rlsPoliciesSql });
    
    // 5. Try to fetch all ads for the campaign using SQL
    const fetchAdsSql = `
      SELECT * FROM ads WHERE campaign_id = '${campaignId}';
    `;
    
    const { data: fetchAdsResult, error: fetchAdsError } = await supabase
      .rpc('exec_sql', { sql_query: fetchAdsSql });
    
    // 6. Check specifically for the test ad we just created
    const checkTestAdSql = `
      SELECT * FROM ads WHERE id = '${testId}';
    `;
    
    const { data: checkTestAdResult, error: checkTestAdError } = await supabase
      .rpc('exec_sql', { sql_query: checkTestAdSql });
    
    // 7. Grant all necessary permissions on the ads table
    const fixPermissionsSql = `
      -- Make sure row level security is enabled
      ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
      
      -- Clear existing policies
      DROP POLICY IF EXISTS "Enable read access for all users" ON public.ads;
      DROP POLICY IF EXISTS "Users can manage their own ads" ON public.ads;
      DROP POLICY IF EXISTS "Service role can manage all ads" ON public.ads;
      
      -- Create comprehensive policies
      CREATE POLICY "Enable read access for all users" ON public.ads
        FOR SELECT USING (true);
      
      CREATE POLICY "Users can manage their own ads" ON public.ads
        FOR ALL USING (auth.uid() = user_id);
      
      CREATE POLICY "Service role can manage all ads" ON public.ads
        FOR ALL USING (auth.role() = 'service_role');
      
      -- Grant direct permissions
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO service_role;
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
    `;
    
    const { data: fixPermissionsResult, error: fixPermissionsError } = await supabase
      .rpc('exec_sql', { sql_query: fixPermissionsSql });
    
    // 8. Check if the campaign exists
    const campaignCheckSql = `
      SELECT * FROM campaigns WHERE id = '${campaignId}';
    `;
    
    const { data: campaignCheck, error: campaignCheckError } = await supabase
      .rpc('exec_sql', { sql_query: campaignCheckSql });
    
    // 9. Check if the user exists
    const userCheckSql = `
      SELECT id, email FROM auth.users WHERE id = '${userId}';
    `;
    
    const { data: userCheck, error: userCheckError } = await supabase
      .rpc('exec_sql', { sql_query: userCheckSql });
    
    // 10. After fixing permissions, try fetching again
    const finalFetchSql = `
      SELECT * FROM ads WHERE campaign_id = '${campaignId}';
    `;
    
    const { data: finalFetchResult, error: finalFetchError } = await supabase
      .rpc('exec_sql', { sql_query: finalFetchSql });
    
    return NextResponse.json({
      message: 'Comprehensive ads diagnostic completed',
      tableCheck: {
        exists: tableCheck ? tableCheck.executed : null,
        error: tableCheckError
      },
      tableStructure: {
        columns: tableStructure ? tableStructure.executed : null,
        error: tableStructureError
      },
      testInsertion: {
        id: testId,
        success: insertResult ? true : false,
        result: insertResult,
        error: insertError
      },
      rlsPolicies: {
        policies: rlsPolicies ? rlsPolicies.executed : null,
        error: rlsPoliciesError
      },
      campaignAds: {
        result: fetchAdsResult ? fetchAdsResult.executed : null,
        error: fetchAdsError,
        count: fetchAdsResult && Array.isArray(fetchAdsResult.executed) ? fetchAdsResult.executed.length : null
      },
      testAdCheck: {
        result: checkTestAdResult ? checkTestAdResult.executed : null,
        error: checkTestAdError
      },
      permissionsFix: {
        success: fixPermissionsResult ? true : false,
        result: fixPermissionsResult,
        error: fixPermissionsError
      },
      campaignCheck: {
        exists: campaignCheck ? campaignCheck.executed : null,
        error: campaignCheckError
      },
      userCheck: {
        exists: userCheck ? userCheck.executed : null,
        error: userCheckError
      },
      finalFetch: {
        result: finalFetchResult ? finalFetchResult.executed : null,
        error: finalFetchError,
        count: finalFetchResult && Array.isArray(finalFetchResult.executed) ? finalFetchResult.executed.length : null
      }
    });
  } catch (error) {
    console.error('Unexpected error in ads fix:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 