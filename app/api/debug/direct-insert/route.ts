import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    
    // Generate test data
    const id = crypto.randomUUID();
    const campaignId = '198b71dc-d98a-4529-b749-ff7387db15be'; // Your campaign ID
    const userId = '4df040f3-050e-49ca-afa2-e36de3f7fa0e'; // Your user ID
    const content = 'Test ad created for debugging - ' + new Date().toISOString();
    const now = new Date().toISOString();
    
    console.log('Attempting to insert test ad with ID:', id);
    
    // First, try to insert via standard API
    const { data: normalInsertData, error: normalInsertError } = await supabase
      .from('ads')
      .insert({
        id,
        campaign_id: campaignId,
        user_id: userId,
        content,
        status: 'draft',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        is_selected: false,
        created_at: now,
        updated_at: now
      })
      .select();
    
    // Now try direct SQL insertion
    const sqlInsertId = crypto.randomUUID();
    const sqlInsertQuery = `
      INSERT INTO ads (
        id, campaign_id, user_id, content, status, 
        impressions, clicks, conversions, is_selected, created_at, updated_at
      ) VALUES (
        '${sqlInsertId}', '${campaignId}', '${userId}', 'SQL Test ad - ${new Date().toISOString()}', 
        'draft', 0, 0, 0, false, '${now}', '${now}'
      ) RETURNING *;
    `;
    
    const { data: sqlInsertData, error: sqlInsertError } = await supabase
      .rpc('exec_sql', { sql_query: sqlInsertQuery });
    
    // Check if either insertion worked by selecting from the database
    const { data: checkData, error: checkError } = await supabase
      .from('ads')
      .select('*')
      .in('id', [id, sqlInsertId]);
    
    // Check via direct SQL query too
    const sqlCheckQuery = `SELECT * FROM ads WHERE id IN ('${id}', '${sqlInsertId}');`;
    const { data: sqlCheckData, error: sqlCheckError } = await supabase
      .rpc('exec_sql', { sql_query: sqlCheckQuery });
    
    // Get all columns in the ads table to debug schema issues
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'ads'
      ORDER BY ordinal_position;
    `;
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', { sql_query: schemaQuery });
    
    // Get all RLS policies on the ads table
    const rlsQuery = `
      SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'ads';
    `;
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('exec_sql', { sql_query: rlsQuery });
    
    return NextResponse.json({
      message: 'Diagnostic test completed',
      insertionTests: {
        normalInsert: {
          success: !normalInsertError,
          id,
          data: normalInsertData,
          error: normalInsertError
        },
        sqlInsert: {
          success: !sqlInsertError,
          id: sqlInsertId,
          data: sqlInsertData,
          error: sqlInsertError
        }
      },
      checkResults: {
        apiCheck: {
          success: !checkError,
          count: checkData?.length || 0,
          data: checkData,
          error: checkError
        },
        sqlCheck: {
          success: !sqlCheckError,
          data: sqlCheckData,
          error: sqlCheckError
        }
      },
      tableInfo: {
        schema: schemaData || [],
        schemaError: schemaError,
        rlsPolicies: rlsData || [],
        rlsError: rlsError
      }
    });
  } catch (error) {
    console.error('Unexpected error in diagnostic test:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 