import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { TIER_LIMITS } from '@/lib/subscription';

/**
 * GET endpoint to fetch campaigns for the logged-in user
 */
export async function GET() {
  try {
    // Log for debugging
    console.log('Campaigns API called');
    
    // Use direct admin access for development
    const supabase = createSupabaseAdmin();
    
    // Get all campaigns - in a real app, you would filter by user_id
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Error fetching campaigns', details: error.message }, { status: 500 });
    }
    
    console.log(`Found ${campaigns?.length || 0} campaigns`);
    
    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    console.error('Unexpected error in campaigns endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Unexpected error', message: errorMessage }, { status: 500 });
  }
}

/**
 * POST endpoint to create a new campaign
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    
    // Extract fields with defaults to avoid undefined
    const name = body.name || '';
    const organization_id = body.organization_id || null;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }
    
    console.log('Creating campaign with name:', name);
    
    // Use direct admin access for development
    const supabase = createSupabaseAdmin();
    
    // Get a valid user ID - first try to find an existing user
    let valid_user_id = null;
    
    // Look for any existing user
    const { data: existingUsers, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (!userError && existingUsers && existingUsers.length > 0) {
      valid_user_id = existingUsers[0].id;
      console.log(`Found existing user: ${valid_user_id}`);
    } else {
      // We couldn't find any user, which is unexpected
      console.error('Could not find any existing users:', userError);
      return NextResponse.json({ 
        error: 'Unable to create campaign', 
        details: 'Could not find a valid user ID' 
      }, { status: 500 });
    }
    
    // 1. Get user ID and subscription tier
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    supabase.auth.setAuth(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error getting user:', authError);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch user data including subscription tier
    const { data: userData, error: userError } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }

    const subscriptionTier = userData.subscription_tier;
    console.log(`User ${userId} has subscription tier: ${subscriptionTier}`);

    // 2. Check campaign limits
    const tierLimits = TIER_LIMITS[subscriptionTier];
    if (!tierLimits) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 500 });
    }

    // Get current campaign count for the user
    const { count: campaignCount, error: countError } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error fetching campaign count:', countError);
      return NextResponse.json({ error: 'Error fetching campaign count' }, { status: 500 });
    }

    console.log(`User ${userId} has ${campaignCount} campaigns, limit: ${tierLimits.maxCampaigns}`);

    if (campaignCount && campaignCount >= tierLimits.maxCampaigns) {
      return NextResponse.json({
        error: 'Campaign limit reached',
        message: `You have reached the maximum number of campaigns (${tierLimits.maxCampaigns}) for your current subscription tier.`,
      }, { status: 403 });
    }

     // First, we need to get or create a default organization for the user
     let org_id = organization_id;
    
     if (!org_id) {
       try {
         // Check if there are any existing organizations
         const { data: existingOrgs, error: orgsError } = await supabase
           .from('organizations')
           .select('id')
           .limit(1);
         
         if (!orgsError && existingOrgs && existingOrgs.length > 0) {
           // Use the first organization we find
           org_id = existingOrgs[0].id;
           console.log(`Using existing organization: ${org_id}`);
         } else {
           // Create a default organization with a valid owner_id
           const { data: newOrg, error: createOrgError } = await supabase
             .from('organizations')
             .insert({ 
               name: 'Default Organization',
               owner_id: userId,  // Use the valid user ID we found
               logo_url: null,
               website: null,
               industry: null,
               size: 'Small'
             })
             .select()
             .single();
           
           if (createOrgError) {
             console.error('Error creating default organization:', createOrgError);
             
             // Try a different approach - just create with name and owner_id
             const { data: simpleOrg, error: simpleError } = await supabase
               .from('organizations')
               .insert({ 
                 name: 'Default Organization',
                 owner_id: userId  // Use the valid user ID
               })
               .select()
               .single();
               
             if (simpleError) {
               console.error('Simple org creation also failed:', simpleError);
               throw new Error(`Failed to create organization: ${simpleError.message}`);
             }
             
             org_id = simpleOrg.id;
           } else {
             org_id = newOrg.id;
           }
           
           console.log(`Created new organization: ${org_id}`);
           
           // Also create a membership record
           const { error: membershipError } = await supabase
             .from('memberships')
             .insert({
               user_id: userId,  // Use the valid user ID
               organization_id: org_id,
               role: 'owner'
             });
           
           if (membershipError) {
             console.error('Error creating membership:', membershipError);
             // Continue anyway since we have an organization
           } else {
             console.log('Created membership successfully');
           }
         }
       } catch (orgError) {
         console.error('Error handling organization:', orgError);
         return NextResponse.json({ 
           error: 'Could not determine organization ID', 
           details: orgError instanceof Error ? orgError.message : 'Unknown error creating organization' 
         }, { status: 500 });
       }
     }
     
     if (!org_id) {
       return NextResponse.json({ 
         error: 'Could not determine organization ID', 
         details: 'Unable to create or find an organization for this user' 
       }, { status: 500 });
     }
     
     // Try creating the campaign with all available fields now that they exist in the table
     const { data: campaign, error } = await supabase
       .from('campaigns')
       .insert({ 
         name, 
         user_id: userId,
         organization_id: org_id,
         status: 'draft',
         target_audience: body.target_audience || null,
         product_description: body.product_description || null,
         tone: body.tone || null,
         budget: body.budget || null,
         start_date: body.start_date || null,
         end_date: body.end_date || null,
         details: body.details || null
       })
       .select()
       .single();
     
     if (error) {
       console.error('Error creating campaign:', error);
       return NextResponse.json({ 
         error: 'Error creating campaign', 
         details: error.message 
       }, { status: 500 });
     }
     
     console.log('Campaign created successfully:', campaign.id);
     
     // Now that the schema is fixed, we can try updating with additional fields if needed
     if (body.target_audience || body.product_description || body.tone || body.details) {
       console.log('Checking for additional updates needed...');
       
       // Check if any fields need updating (in case they weren't included in the initial insert)
       const hasFieldsToUpdate = (
         (body.target_audience && !campaign.target_audience) || 
         (body.product_description && !campaign.product_description) || 
         (body.tone && !campaign.tone) ||
         (body.details && !campaign.details)
       );
       
       if (hasFieldsToUpdate) {
         console.log('Updating campaign with additional fields');
         
         try {
           // Create an update object with only the fields that need updating
           const updateData: Record<string, string | null | object> = {};
           
           if (body.target_audience && !campaign.target_audience) {
             updateData.target_audience = body.target_audience;
           }
           
           if (body.product_description && !campaign.product_description) {
             updateData.product_description = body.product_description;
           }
           
           if (body.tone && !campaign.tone) {
             updateData.tone = body.tone;
           }
           
           if (body.details && !campaign.details) {
             updateData.details = body.details;
           }
           
           if (Object.keys(updateData).length > 0) {
             const { data: updatedCampaign, error: updateError } = await supabase
               .from('campaigns')
               .update(updateData)
               .eq('id', campaign.id)
               .select()
               .single();
             
             if (!updateError && updatedCampaign) {
               console.log('Campaign updated with additional fields');
               return NextResponse.json({ campaign: updatedCampaign }, { status: 201 });
             }
             
             // If update fails, we still return the original campaign
             console.warn('Could not update campaign with additional fields:', updateError);
           }
         } catch (updateError) {
           console.warn('Error updating campaign with additional fields:', updateError);
           // Continue to return the original campaign
         }
       }
     }
     
     return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: unknown) {
    console.error('Unexpected error in campaigns POST endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Unexpected error', message: errorMessage }, { status: 500 });
  }
} 