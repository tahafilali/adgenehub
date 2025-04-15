import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';
import { TIER_LIMITS } from '@/lib/subscription';
/**
 * GET endpoint to fetch ads for a campaign
 */
export async function GET(
  req: Request,
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
    console.log('Creating a new ad...');
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

    // Fetch user data including subscription tier
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }

    const subscriptionTier = userData.subscription_tier || 'free';
    console.log(`User ${user.id} has subscription tier: ${subscriptionTier}`);

    // Check ad limits
    const tierLimits = TIER_LIMITS[subscriptionTier as keyof typeof TIER_LIMITS];
    if (!tierLimits) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 500 });
    }

    // Get current ad count for the campaign
    const { count: adCount, error: countError } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (countError) {
      console.error('Error fetching ad count:', countError);
      return NextResponse.json({ error: 'Error fetching ad count' }, { status: 500 });
    }

    console.log(`Campaign ${campaignId} has ${adCount} ads, limit: ${tierLimits.adsPerCampaign}`);


    // Get the request body
    const body = await request.json();
    
    // Check if we're creating from a template
    const templateId = body.template_id;
    let adText = body.ad_text || '';
    let adName = body.name || `New Ad ${new Date().toLocaleDateString()}`;
    const file = body.file || null;
    
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
    
    if (adCount !== null && adCount >= tierLimits.adsPerCampaign) {
      return NextResponse.json({
        error: 'Ad limit reached',
        message: `You have reached the maximum number of ads (${tierLimits.adsPerCampaign}) for this campaign in your current subscription tier.`,
      }, { status: 403 });
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
          file: file,
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
      message: 'Ad created successfully',
      count: adCount !== null ? adCount + 1 : 1,
      adsLimit: tierLimits.adsPerCampaign,
      ad
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating ad:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}