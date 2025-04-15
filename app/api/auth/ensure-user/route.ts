import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { PLANS } from '@/lib/stripe';

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
      console.error('Exception checking users table:', error);
    }
    
    // Check if user exists in database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    // If user doesn't exist, create one
    if (userError && userError.code === 'PGRST116') { // No rows returned
      console.log(`Creating missing user record for: ${userEmail}`);
      
      // Generate a timestamp for both created_at and updated_at
      const timestamp = new Date().toISOString();
      
      // Insert user into database
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          full_name: authData.user.user_metadata.full_name,
          subscription_tier: 'free',
          credits_used: 0,
          credits_limit: PLANS.FREE.credits,
          created_at: timestamp,
          updated_at: timestamp,
        });
      
      if (insertError) {
        console.error('Error creating user record:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user record', details: insertError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        status: 'created', 
        userId,
        message: 'User record successfully created'
      });
    } else if (userError) {
      console.error('Error checking if user exists:', userError);
      return NextResponse.json(
        { error: 'Error checking user existence', details: userError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      status: 'exists', 
      userId,
      message: 'User record already exists'
    });
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 