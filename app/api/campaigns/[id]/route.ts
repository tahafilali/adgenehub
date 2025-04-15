import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';

/**
 * GET endpoint to fetch a single campaign by ID and its associated ads
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use admin client to bypass RLS policies
  const supabase = createSupabaseAdmin();
  
  try {
    const { id } = params;
    
    console.log(`Fetching campaign with ID: ${id}`);
    
    // Get the campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching campaign:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Use a simple direct SQL query to fetch ads
    console.log(`Fetching ads for campaign: ${id}`);
    const sqlQuery = `SELECT * FROM public.ads WHERE campaign_id = '${id}';`;
    
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql', { sql_query: sqlQuery });
    
    let ads = [];
    
    if (sqlError) {
      console.error('Error fetching ads with SQL:', sqlError);
      
      // Fall back to normal fetch
      const { data: apiAds, error: apiError } = await supabase
        .from('ads')
        .select('*')
        .eq('campaign_id', id);
      
      if (apiError) {
        console.error('API fetch also failed:', apiError);
      } else {
        ads = apiAds || [];
        console.log(`API found ${ads.length} ads`);
      }
    } else {
      if (sqlResult && typeof sqlResult === 'object') {
        if (Array.isArray(sqlResult.executed)) {
          ads = sqlResult.executed;
          console.log(`SQL found ${ads.length} ads`);
        } else {
          console.log('SQL result:', sqlResult);
          
          // Fall back to normal fetch if SQL result doesn't have expected format
          const { data: apiAds, error: apiError } = await supabase
            .from('ads')
            .select('*')
            .eq('campaign_id', id);
          
          if (apiError) {
            console.error('API fetch fallback failed:', apiError);
          } else {
            ads = apiAds || [];
            console.log(`API fallback found ${ads.length} ads`);
          }
        }
      }
    }
    
    console.log(`Returning campaign ${campaign.name} with ${ads.length} ads`);
    
    // Return the campaign and its ads
    return NextResponse.json({
      campaign,
      ads
    });
  } catch (error: unknown) {
    console.error('Unexpected error fetching campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: errorMessage 
    }, { status: 500 });
  }
}

/**
 * PATCH endpoint to update a campaign by ID
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use admin client to bypass RLS policies
  const supabase = createSupabaseAdmin();
  
  try {
    const { id } = params;
    const body = await req.json();
    
    console.log(`Updating campaign with ID: ${id}`, body);
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ 
        error: 'Campaign name is required' 
      }, { status: 400 });
    }
    
    // Check if campaign exists
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Update the campaign
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        name: body.name,
        target_audience: body.target_audience,
        product_description: body.product_description,
        tone: body.tone,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Error updating campaign:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Get the updated campaign
    const { data: updatedCampaign, error: getError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Error getting updated campaign:', getError);
      return NextResponse.json({ error: getError.message }, { status: 500 });
    }
    
    console.log(`Campaign updated successfully: ${updatedCampaign.name}`);
    
    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error: unknown) {
    console.error('Unexpected error updating campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: errorMessage 
    }, { status: 500 });
  }
}

/**
 * DELETE endpoint to delete a campaign by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Use admin client to bypass RLS policies
  const supabase = createSupabaseAdmin();
  
  try {
    const { id } = params;
    
    console.log(`Deleting campaign with ID: ${id}`);
    
    // Check if campaign exists
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // First, delete associated ads
    const { error: adsError } = await supabase
      .from('ads')
      .delete()
      .eq('campaign_id', id);
    
    if (adsError) {
      console.error('Error deleting associated ads:', adsError);
      return NextResponse.json({ 
        error: 'Failed to delete associated ads', 
        details: adsError.message 
      }, { status: 500 });
    }
    
    // Then delete the campaign
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete campaign', 
        details: deleteError.message 
      }, { status: 500 });
    }
    
    console.log(`Campaign deleted successfully: ${id}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error: unknown) {
    console.error('Unexpected error deleting campaign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: errorMessage 
    }, { status: 500 });
  }
}

/**
 * PUT endpoint to update a campaign by ID
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createSupabaseAdmin();
    
    // Get request body
    const body = await req.json();
    const { name, target_audience, product_description, tone } = body;
    
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }
    
    // Check if the campaign exists
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Update the campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update({
        name,
        target_audience,
        product_description,
        tone,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating campaign:', error);
      return NextResponse.json({ 
        error: 'Failed to update campaign', 
        details: error.message 
      }, { status: 500 });
    }
    
    console.log(`Campaign updated successfully: ${campaign.name}`);
    
    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    console.error('Unexpected error updating campaign:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 