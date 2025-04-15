import { createClient } from '@supabase/supabase-js';

type SocialMediaPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin';

interface PublishOptions {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  adType: string;
  userId: string;
  campaignId: string;
  adId: string;
  platforms: SocialMediaPlatform[];
}

interface SocialMediaToken {
  platform: SocialMediaPlatform;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  account_id?: string;
  page_id?: string;
}

/**
 * Service to publish ads to social media platforms
 */
export class SocialMediaService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get social media tokens for a user
   */
  private async getUserTokens(userId: string): Promise<SocialMediaToken[]> {
    const { data, error } = await this.supabase
      .from('social_media_tokens')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching social media tokens: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Log a publishing attempt
   */
  private async logPublishAttempt(
    userId: string,
    adId: string,
    platform: SocialMediaPlatform,
    success: boolean,
    postId?: string,
    error?: string
  ) {
    await this.supabase
      .from('social_media_posts')
      .insert({
        user_id: userId,
        ad_id: adId,
        platform,
        success,
        post_id: postId,
        error_message: error,
        published_at: new Date().toISOString()
      });
  }

  /**
   * Publish to Facebook
   */
  private async publishToFacebook(
    content: string,
    imageUrl: string | undefined,
    videoUrl: string | undefined,
    token: SocialMediaToken
  ): Promise<string> {
    try {
      // This is a simplified example - in real implementation,
      // you would use the Facebook Graph API
      const pageId = token.page_id;
      const accessToken = token.access_token;
      
      let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      let body: any = {
        message: content,
        access_token: accessToken
      };
      
      // If there's an image, use the photos endpoint
      if (imageUrl) {
        endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
        body.url = imageUrl;
      }
      
      // If there's a video, use the videos endpoint
      if (videoUrl) {
        endpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
        body.file_url = videoUrl;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error publishing to Facebook:', error);
      throw error;
    }
  }

  /**
   * Publish to Twitter
   */
  private async publishToTwitter(
    content: string,
    imageUrl: string | undefined,
    videoUrl: string | undefined,
    token: SocialMediaToken
  ): Promise<string> {
    try {
      // Simplified example - in reality, would use Twitter API v2
      // For production, use a proper Twitter API library
      
      // In this simplified version, we're just returning a mock ID
      return `twitter-mock-${Date.now()}`;
    } catch (error) {
      console.error('Error publishing to Twitter:', error);
      throw error;
    }
  }

  /**
   * Publish to LinkedIn
   */
  private async publishToLinkedIn(
    content: string,
    imageUrl: string | undefined,
    videoUrl: string | undefined,
    token: SocialMediaToken
  ): Promise<string> {
    try {
      // Simplified example - in reality, would use LinkedIn API
      // For production, use a proper LinkedIn API library
      
      // In this simplified version, we're just returning a mock ID
      return `linkedin-mock-${Date.now()}`;
    } catch (error) {
      console.error('Error publishing to LinkedIn:', error);
      throw error;
    }
  }

  /**
   * Publish to Instagram
   */
  private async publishToInstagram(
    content: string,
    imageUrl: string | undefined,
    videoUrl: string | undefined,
    token: SocialMediaToken
  ): Promise<string> {
    try {
      // Instagram publishing requires using the Facebook Graph API
      // For production, use a proper Instagram API library
      
      // In this simplified version, we're just returning a mock ID
      return `instagram-mock-${Date.now()}`;
    } catch (error) {
      console.error('Error publishing to Instagram:', error);
      throw error;
    }
  }

  /**
   * Publish an ad to social media platforms
   */
  public async publishAd(options: PublishOptions): Promise<Record<SocialMediaPlatform, { success: boolean; postId?: string; error?: string }>> {
    const { content, imageUrl, videoUrl, platforms, userId, adId } = options;
    const tokens = await this.getUserTokens(userId);
    
    const results: Record<SocialMediaPlatform, { success: boolean; postId?: string; error?: string }> = {} as any;
    
    // Process each platform in parallel
    await Promise.all(
      platforms.map(async (platform) => {
        const token = tokens.find(t => t.platform === platform);
        
        if (!token) {
          results[platform] = { 
            success: false, 
            error: `No credentials found for ${platform}` 
          };
          await this.logPublishAttempt(userId, adId, platform, false, undefined, `No credentials found for ${platform}`);
          return;
        }
        
        try {
          let postId: string;
          
          switch (platform) {
            case 'facebook':
              postId = await this.publishToFacebook(content, imageUrl, videoUrl, token);
              break;
            case 'twitter':
              postId = await this.publishToTwitter(content, imageUrl, videoUrl, token);
              break;
            case 'linkedin':
              postId = await this.publishToLinkedIn(content, imageUrl, videoUrl, token);
              break;
            case 'instagram':
              postId = await this.publishToInstagram(content, imageUrl, videoUrl, token);
              break;
            default:
              throw new Error(`Unsupported platform: ${platform}`);
          }
          
          results[platform] = { success: true, postId };
          await this.logPublishAttempt(userId, adId, platform, true, postId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results[platform] = { success: false, error: errorMessage };
          await this.logPublishAttempt(userId, adId, platform, false, undefined, errorMessage);
        }
      })
    );
    
    return results;
  }
} 