-- Reset and drop any existing functions
DROP FUNCTION IF EXISTS create_user_function();
DROP FUNCTION IF EXISTS create_user_record(uuid, text, text);
DROP FUNCTION IF EXISTS execute_sql(text);

-- Create a function to execute raw SQL (use with caution!)
CREATE OR REPLACE FUNCTION create_execute_sql_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This is critical - allows function to bypass RLS
AS $$
BEGIN
  -- Create the function to execute arbitrary SQL
  EXECUTE '
    CREATE OR REPLACE FUNCTION execute_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER -- This allows the function to bypass RLS
    AS $func$
    BEGIN
      EXECUTE sql;
    END;
    $func$;
  ';
  
  -- Grant execute permission to the function
  EXECUTE 'GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;';
END;
$$;

-- Create a function to create the user record creation function
CREATE OR REPLACE FUNCTION create_user_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This is critical - allows function to bypass RLS
AS $$
BEGIN
  -- Drop the function if it already exists
  DROP FUNCTION IF EXISTS create_user_record(uuid, text, text);
  
  -- Create the function
  EXECUTE '
    CREATE OR REPLACE FUNCTION create_user_record(
      user_id uuid,
      user_email text,
      user_full_name text DEFAULT NULL
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER -- This allows the function to bypass RLS
    AS $func$
    BEGIN
      INSERT INTO public.users (
        id,
        email,
        full_name,
        subscription_tier,
        credits_used,
        credits_limit,
        created_at,
        updated_at
      ) VALUES (
        user_id,
        user_email,
        user_full_name,
        ''free'',
        0,
        1000,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    END;
    $func$;
  ';
  
  -- Grant execute permission to the function
  EXECUTE 'GRANT EXECUTE ON FUNCTION create_user_record(uuid, text, text) TO service_role;';
END;
$$;

-- Grant execute permission to the meta functions
GRANT EXECUTE ON FUNCTION create_user_function() TO service_role;
GRANT EXECUTE ON FUNCTION create_execute_sql_function() TO service_role;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all data" ON public.users;

-- Create a simple blanket policy for service role - this is critical!
CREATE POLICY "Service role can do anything" ON public.users
  FOR ALL USING (true);

-- Grant permissions to service role
GRANT ALL ON public.users TO service_role; 