import { createSupabaseAdmin } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET endpoint to fetch templates with filtering by tier, category, and search
 */
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const tier = searchParams.get('tier');
    const category = searchParams.get('category');
    
    // Create a Supabase client
    const supabase = createSupabaseAdmin();
    
    // Start building the query
    let query = supabase.from('templates').select('*');
    
    // Apply filters if provided
    if (tier) {
      query = query.eq('tier', tier);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    // Execute the query
    const { data, error } = await query.order('name');
    
    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('Unexpected error in templates API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 