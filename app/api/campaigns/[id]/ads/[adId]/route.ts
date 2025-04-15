import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { createSupabaseAdmin } from '@/lib/supabase-server';

// GET endpoint to fetch a single ad
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; adId: string } }
) {
  try {
    // Get the campaign ID and ad ID from the route params
    const { id: campaignId, adId } = params;
    
    // Create a Supabase admin client
    const supabase = createSupabaseAdmin();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the ad, ensuring it belongs to the user and the specified campaign
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();
    
    if (adError || !ad) {
      console.error('Error fetching ad:', adError);
      return NextResponse.json({ error: 'Ad not found or access denied' }, { status: 404 });
    }
    
    // Return the ad
    return NextResponse.json({ ad });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

/**
 * PATCH endpoint to update an ad
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; adId: string } }
) {
  try {
    const { id: campaignId, adId } = params;
    const body = await req.json();
    
    console.log(`Updating ad ${adId} for campaign: ${campaignId}`);
    
    // Create a Supabase admin client
    const supabase = createSupabaseAdmin();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    
    // First get the ad to check if it exists and belongs to the user
    const { data: existingAd, error: fetchError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching ad:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch ad', 
        details: fetchError.message 
      }, { status: 500 });
    }
    
    if (!existingAd) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    // If setting this ad as selected, unselect all other ads for this campaign
    if (body.is_selected) {
      const { error: unselectError } = await supabase
        .from('ads')
        .update({ is_selected: false })
        .eq('campaign_id', campaignId)
        .neq('id', adId);
      
      if (unselectError) {
        console.error('Error unselecting other ads:', unselectError);
        // Continue anyway, not a fatal error
      }
    }
    
    // Update the ad
    const { data: updatedAd, error: updateError } = await supabase
      .from('ads')
      .update({
        content: body.content !== undefined ? body.content : existingAd.content,
        status: body.status !== undefined ? body.status : existingAd.status,
        is_selected: body.is_selected !== undefined ? body.is_selected : existingAd.is_selected,
        updated_at: new Date().toISOString()
      })
      .eq('id', adId)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating ad:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update ad', 
        details: updateError.message 
      }, { status: 500 });
    }
    
    console.log(`Ad updated successfully: ${adId}`);
    
    return NextResponse.json({ ad: updatedAd });
  } catch (error: unknown) {
    console.error('Unexpected error updating ad:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Unexpected error', 
      message: errorMessage 
    }, { status: 500 });
  }
}

/**
 * DELETE endpoint to delete an ad
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; adId: string } }
) {
  try {
    const { id: campaignId, adId } = params;
    
    // Use admin client to bypass RLS policies
    const supabase = createSupabaseAdmin();
    
    console.log(`Deleting ad ${adId} from campaign ${campaignId}`);
    
    // Check if ad exists and belongs to the campaign
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('*')
      .eq('id', adId)
      .eq('campaign_id', campaignId)
      .single();
    
    if (adError || !ad) {
      console.error('Error fetching ad:', adError);
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    // Delete the ad
    const { error: deleteError } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId);
    
    if (deleteError) {
      console.error('Error deleting ad:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete ad', details: deleteError.message },
        { status: 500 }
      );
    }
    
    console.log(`Ad deleted successfully: ${adId}`);
    
    return NextResponse.json(
      { success: true, message: 'Ad deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error deleting ad:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 