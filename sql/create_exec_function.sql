
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS VOID AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
    GRANT EXECUTE ON FUNCTION exec_sql TO service_role;
    
    -- Comment on function
    COMMENT ON FUNCTION exec_sql IS 'Execute arbitrary SQL (use with caution)';
    