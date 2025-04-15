import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET endpoint to fetch ads for a campaign
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`Fetching ads for campaign: ${id}`);
    
    // Use admin client to access the database
    const supabase = createSupabaseAdmin();
    
    // Get the campaign to verify it exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', id)
      .single();
    
    if (campaignError) {
      console.error('Error fetching campaign:', campaignError);
      return NextResponse.json({ 
        error: 'Failed to fetch campaign', 
        details: campaignError.message 
      }, { status: 500 });
    }
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Fetch all ads for the campaign
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });
    
    if (adsError) {
      console.error('Error fetching ads:', adsError);
      return NextResponse.json({ 
        error: 'Failed to fetch ads', 
        details: adsError.message 
      }, { status: 500 });
    }
    
    console.log(`Found ${ads.length} ads for campaign ${id}`);
    
    return NextResponse.json({ ads });
  } catch (error: unknown) {
    console.error('Unexpected error fetching ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: errorMessage 
    }, { status: 500 });
  }
}

/**
 * POST endpoint to create a new ad for a campaign
 * Can also generate ads using AI when the generate param is set to 'true'
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    const supabase = createSupabaseAdmin();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify the campaign exists and belongs to the user
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();
    
    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or you do not have access to it' },
        { status: 404 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Check if we're creating from a template
    const templateId = body.template_id;
    let adText = body.ad_text || '';
    let adName = body.name || `New Ad ${new Date().toLocaleDateString()}`;
    
    // If a template ID is provided, fetch the template details
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (templateError) {
        console.error('Error fetching template:', templateError);
        // Continue with the data provided in the request
      } else if (template) {
        // Use template data if not overridden in the request
        adText = adText || template.preview_text;
        adName = adName || `Ad based on ${template.name}`;
      }
    }
    
    // Create the ad
    const { data: ad, error: createError } = await supabase
      .from('ads')
      .insert({
        id: uuidv4(),
        campaign_id: campaignId,
        user_id: user.id,
        content: adText,
        name: adName,
        status: 'draft',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        is_selected: false,
        template_id: templateId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating ad:', createError);
      return NextResponse.json(
        { error: 'Failed to create ad', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      ad,
      message: 'Ad created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating ad:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}