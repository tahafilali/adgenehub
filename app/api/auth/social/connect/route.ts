import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST endpoint to store social media platform tokens
 */
export async function POST(req: NextRequest) {
  try {
    const {
      platform,
      accessToken,
      refreshToken,
      expiresAt,
      accountId,
      pageId
    } = await req.json();
    
    // Basic validation
    if (!platform || !accessToken) {
      return NextResponse.json({ 
        error: 'Platform and access token are required' 
      }, { status: 400 });
    }
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true
        }
      }
    );
    
    // Get the authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if a token for this platform already exists
    const { data: existingToken, error: fetchError } = await supabase
      .from('social_media_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // Handle errors other than "no rows returned"
      console.error('Error checking existing token:', fetchError);
      return NextResponse.json({ 
        error: 'Error checking existing tokens', 
        details: fetchError.message 
      }, { status: 500 });
    }
    
    const tokenData = {
      user_id: userId,
      platform,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      account_id: accountId,
      page_id: pageId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (existingToken) {
      // Update existing token
      const { data, error: updateError } = await supabase
        .from('social_media_tokens')
        .update(tokenData)
        .eq('id', existingToken.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating token:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update token', 
          details: updateError.message 
        }, { status: 500 });
      }
      
      result = data;
    } else {
      // Insert new token
      const { data, error: insertError } = await supabase
        .from('social_media_tokens')
        .insert(tokenData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting token:', insertError);
        return NextResponse.json({ 
          error: 'Failed to store token', 
          details: insertError.message 
        }, { status: 500 });
      }
      
      result = data;
    }
    
    // Return the token data but mask the actual tokens
    return NextResponse.json({
      id: result.id,
      platform: result.platform,
      accountId: result.account_id,
      pageId: result.page_id,
      connected: true,
      expiresAt: result.expires_at,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    });
  } catch (error) {
    console.error('Unexpected error storing social media token:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve connected social media platforms
 */
export async function GET(req: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true
        }
      }
    );
    
    // Get the authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Fetch all tokens for the user
    const { data: tokens, error } = await supabase
      .from('social_media_tokens')
      .select('id, platform, account_id, page_id, created_at, updated_at, expires_at')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching social media tokens:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch social connections', 
        details: error.message 
      }, { status: 500 });
    }
    
    // Transform the tokens into connected platforms
    const connections = tokens.map(token => ({
      id: token.id,
      platform: token.platform,
      accountId: token.account_id,
      pageId: token.page_id,
      connected: true,
      expiresAt: token.expires_at,
      createdAt: token.created_at,
      updatedAt: token.updated_at
    }));
    
    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Unexpected error retrieving social media connections:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 