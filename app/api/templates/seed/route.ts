import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

// POST endpoint to seed templates table with default templates
export async function POST() {
  try {
    const supabase = createSupabaseAdmin();
    
    console.log('Seeding templates table with default templates...');
    
    // Default templates for basic tier
    const basicTemplates = [
      {
        id: uuidv4(),
        name: 'Product Announcement',
        description: 'Announce a new product or feature with this template',
        preview_text: 'Introducing [product] - the easiest way to [benefit]. Try it today and experience [unique advantage].',
        category: 'announcement',
        tier: 'basic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Limited Time Offer',
        description: 'Create urgency with a time-limited promotion',
        preview_text: 'For a limited time only: Get [product] with [discount/offer]. Ends [date/time frame]!',
        category: 'promotion',
        tier: 'basic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Problem-Solution',
        description: 'Address a pain point and offer your solution',
        preview_text: 'Tired of [problem]? [Product] helps you [solution] without the [pain point].',
        category: 'solution',
        tier: 'basic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Add templates to the database
    const { data, error } = await supabase
      .from('templates')
      .upsert(basicTemplates)
      .select();
    
    if (error) {
      console.error('Error inserting templates:', error);
      
      // Check if we need to create the table first
      if (error.code === '42P01') { // Table doesn't exist
        return NextResponse.json({ 
          error: 'Templates table does not exist. Please create it first.', 
          details: error.message 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to seed templates', 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully added ${data.length} templates`,
      templates: data
    });
  } catch (error) {
    console.error('Unexpected error seeding templates:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 