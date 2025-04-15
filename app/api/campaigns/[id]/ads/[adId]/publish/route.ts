import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { SocialMediaService } from '@/lib/social-media-service';

/**
 * POST endpoint to publish an ad to social media platforms
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; adId: string } }
) {
  try {
    const { id: campaignId, adId } = params;
    const body = await req.json();
    const { platforms } = body;
    
    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ 
        error: 'At least one platform must be specified' 
      }, { status: 400 });
    }
    
    // Initialize the Supabase client
    const supabase = createSupabaseAdmin();
    
    // Get the ad to verify it exists and get its content
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('*, campaigns!inner(*)')
      .eq('id', adId)
      .eq('campaigns.id', campaignId)
      .single();
    
    if (adError) {
      console.error('Error fetching ad:', adError);
      return NextResponse.json({ 
        error: 'Failed to fetch ad', 
        details: adError.message 
      }, { status: 500 });
    }
    
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    
    // Initialize the social media service
    const socialMediaService = new SocialMediaService();
    
    // Publish the ad to selected platforms
    const results = await socialMediaService.publishAd({
      content: ad.content,
      imageUrl: ad.image_url,
      videoUrl: ad.video_url,
      adType: ad.ad_type || 'text',
      userId: ad.user_id,
      campaignId: campaignId,
      adId: adId,
      platforms
    });
    
    // Update the ad status to 'published' if at least one platform was successful
    const anySuccess = Object.values(results).some(result => result.success);
    
    if (anySuccess) {
      const { error: updateError } = await supabase
        .from('ads')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', adId);
      
      if (updateError) {
        console.error('Error updating ad status:', updateError);
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Unexpected error during ad publishing:', error);
    return NextResponse.json({ 
      error: 'Unexpected error during publishing',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 