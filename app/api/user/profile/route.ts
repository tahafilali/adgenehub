import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

// GET endpoint to fetch user profile
export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // Get the authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the user profile from the users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Error fetching user profile' }, { status: 500 });
    }
    
    // Return the user profile
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

// PATCH endpoint to update user profile
export async function PATCH(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { full_name, company_name } = body;
    
    // Create a Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // Get the authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Prepare update object with only the fields that are provided
    const updateData: Partial<Database['public']['Tables']['users']['Update']> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (company_name !== undefined) updateData.company_name = company_name;
    
    // Add the updated_at timestamp
    updateData.updated_at = new Date().toISOString();
    
    // Update the user profile
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', session.user.id)
      .select('*')
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'Error updating user profile' }, { status: 500 });
    }
    
    // Return the updated user profile
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
} 