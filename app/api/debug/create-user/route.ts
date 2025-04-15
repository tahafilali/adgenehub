import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the user ID from request
    const { userId, email, fullName } = await request.json();
    
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }
    
    console.log(`DEBUG: Attempting to create user record for ${userId} (${email})`);
    
    // Create client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // First, check if users table exists
    try {
      const { error: tableCheckError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.error('Error checking table:', tableCheckError);
        return NextResponse.json(
          { error: 'Error checking users table', details: tableCheckError },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error('Exception checking table:', err);
      return NextResponse.json(
        { error: 'Exception checking users table' },
        { status: 500 }
      );
    }
    
    // Now try to check if user exists
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing user:', checkError);
        return NextResponse.json(
          { error: 'Error checking if user exists', details: checkError },
          { status: 500 }
        );
      }
      
      if (existingUser) {
        return NextResponse.json({ 
          status: 'exists', 
          message: 'User already exists',
          userId 
        });
      }
    } catch (err) {
      console.error('Exception checking user:', err);
    }
    
    // Try to insert user with explicit schema
    try {
      const timestamp = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || null,
          company_name: null,
          subscription_tier: 'free',
          subscription_status: null,
          credits_used: 0,
          credits_limit: 1000,
          trial_end_date: null,
          stripe_customer_id: null,
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
          { error: 'Failed to create user record', details: error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        status: 'created', 
        userId,
        userData: data
      });
    } catch (err) {
      console.error('Exception creating user:', err);
      return NextResponse.json(
        { error: 'Exception creating user record', details: String(err) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Overall error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 