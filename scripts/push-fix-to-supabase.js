const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Validate required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('Applying fix for memberships policy recursion...');
  
  try {
    // Execute queries in sequence
    
    // 1. Disable RLS temporarily
    console.log('1. Disabling Row Level Security on memberships table...');
    const { error: disableRlsError } = await supabase.rpc('admin_query', {
      query_text: 'ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableRlsError) {
      console.error('Error disabling RLS:', disableRlsError);
      return false;
    }
    
    // 2. Drop existing policies
    console.log('2. Dropping existing policies...');
    const { error: dropPoliciesError } = await supabase.rpc('admin_query', {
      query_text: `
        DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.memberships;
        DROP POLICY IF EXISTS "Users can view memberships they belong to" ON public.memberships;
        DROP POLICY IF EXISTS "Service role can manage memberships" ON public.memberships;
        DROP POLICY IF EXISTS "Members can view their own memberships" ON public.memberships;
        DROP POLICY IF EXISTS "Admin access all memberships" ON public.memberships;
        DROP POLICY IF EXISTS "Service role access" ON public.memberships;
      `
    });
    
    if (dropPoliciesError) {
      console.error('Error dropping policies:', dropPoliciesError);
      return false;
    }
    
    // 3. Create helper function
    console.log('3. Creating helper function...');
    const { error: createFunctionError } = await supabase.rpc('admin_query', {
      query_text: `
        CREATE OR REPLACE FUNCTION public.is_org_admin(user_uuid UUID, org_uuid UUID) 
        RETURNS BOOLEAN AS $$
        DECLARE
          is_admin BOOLEAN;
        BEGIN
          SELECT EXISTS (
            SELECT 1 FROM public.memberships
            WHERE user_id = user_uuid
            AND organization_id = org_uuid
            AND role IN ('owner', 'admin')
          ) INTO is_admin;
          
          RETURN is_admin;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (createFunctionError) {
      console.error('Error creating function:', createFunctionError);
      return false;
    }
    
    // 4. Re-enable RLS
    console.log('4. Re-enabling Row Level Security...');
    const { error: enableRlsError } = await supabase.rpc('admin_query', {
      query_text: 'ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRlsError) {
      console.error('Error enabling RLS:', enableRlsError);
      return false;
    }
    
    // 5. Create new policies
    console.log('5. Creating new policies...');
    const { error: createPoliciesError } = await supabase.rpc('admin_query', {
      query_text: `
        CREATE POLICY "Members can view their own memberships" 
          ON public.memberships FOR SELECT 
          USING (user_id = auth.uid());
        
        CREATE POLICY "Admin access all memberships" 
          ON public.memberships FOR ALL 
          USING (public.is_org_admin(auth.uid(), organization_id));
        
        CREATE POLICY "Service role access" 
          ON public.memberships FOR ALL 
          USING (true);
      `
    });
    
    if (createPoliciesError) {
      console.error('Error creating policies:', createPoliciesError);
      return false;
    }
    
    // 6. Grant permissions
    console.log('6. Granting permissions...');
    const { error: grantPermissionsError } = await supabase.rpc('admin_query', {
      query_text: `
        GRANT ALL ON public.memberships TO authenticated, service_role;
        GRANT EXECUTE ON FUNCTION public.is_org_admin TO authenticated, service_role;
      `
    });
    
    if (grantPermissionsError) {
      console.error('Error granting permissions:', grantPermissionsError);
      return false;
    }
    
    // 7. Add function documentation
    console.log('7. Adding function documentation...');
    const { error: addDocError } = await supabase.rpc('admin_query', {
      query_text: `
        COMMENT ON FUNCTION public.is_org_admin IS 'Checks if a user is an admin or owner of an organization';
      `
    });
    
    if (addDocError) {
      console.error('Error adding documentation:', addDocError);
      return false;
    }
    
    console.log('✅ Successfully applied fix for memberships policy recursion!');
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Execute the fix
applyFix()
  .then(success => {
    if (!success) {
      console.error('❌ Failed to apply fix.');
      console.log('\nAlternative: Run this SQL directly in the Supabase SQL Editor:');
      const sqlPath = path.join(__dirname, '../sql/20250411_fix_memberships_policy.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('\n------ COPY SQL BELOW ------\n');
        console.log(sql);
        console.log('\n------ END SQL ------\n');
      }
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 