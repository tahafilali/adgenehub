import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { TIER_LIMITS } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase admin client
    const supabase = createSupabaseAdmin();
    
    // Get current user from session token
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('Error getting authenticated user:', authError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userId = authData.user.id;
    const userEmail = authData.user.email;
    
    console.log('Ensuring user record exists for:', userEmail);
    
    // Check if the users table exists
    try {
      const { error: tableError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      if (tableError) {
        console.error('Error verifying users table:', tableError);
        if (tableError.message.includes('relation "public.users" does not exist')) {
          return NextResponse.json(
            { error: 'The users table does not exist', details: 'Please create it before proceeding' },
            { status: 500 }
          );
        }
      }
    } catch (error) {
      console.error('Error checking users table:', error);
      return NextResponse.json(
        { error: 'Error checking users table', details: error.message },
        { status: 500 }
      );
    }
    
    // Fetch user data, including subscription_tier
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, subscription_tier')
      .eq('id', userId)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // User doesn't exist, create a new user with the free tier
        const timestamp = new Date().toISOString();
        const { data, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            full_name: authData.user.user_metadata.full_name,
            subscription_tier: 'free',
            created_at: timestamp,
            updated_at: timestamp,
          })
          .select('id, subscription_tier')
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          return NextResponse.json(
            { error: 'Error creating user', details: insertError.message },
            { status: 500 }
          );
        }

        userData = data;
        console.log(`Created user: ${userEmail} with tier: free`);
      } else {
        console.error('Error fetching user:', userError);
        return NextResponse.json(
          { error: 'Error fetching user', details: userError.message },
          { status: 500 }
        );
      }
    }

    // Return the subscription tier
    return NextResponse.json({
      userId: userData.id,
      subscriptionTier: userData.subscription_tier,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}