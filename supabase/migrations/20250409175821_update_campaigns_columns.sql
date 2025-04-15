-- Update campaigns table to add missing columns and ensure they're present
DO $$ 
BEGIN 
    -- Add product_description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'product_description') THEN
        ALTER TABLE public.campaigns ADD COLUMN product_description TEXT;
    END IF;

    -- Add target_audience column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'target_audience') THEN
        ALTER TABLE public.campaigns ADD COLUMN target_audience TEXT;
    END IF;

    -- Add tone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'tone') THEN
        ALTER TABLE public.campaigns ADD COLUMN tone TEXT;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'status') THEN
        ALTER TABLE public.campaigns ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;

    -- Add budget column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'budget') THEN
        ALTER TABLE public.campaigns ADD COLUMN budget DECIMAL(10, 2);
    END IF;

    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'start_date') THEN
        ALTER TABLE public.campaigns ADD COLUMN start_date TIMESTAMP;
    END IF;

    -- Add end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'end_date') THEN
        ALTER TABLE public.campaigns ADD COLUMN end_date TIMESTAMP;
    END IF;

    -- Make organization_id nullable if it's not already
    -- This allows flexibility while we're sorting out the data model
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'organization_id' 
        AND is_nullable = 'NO'
    ) THEN
        -- Drop existing foreign key constraint
        EXECUTE 'ALTER TABLE public.campaigns ALTER COLUMN organization_id DROP NOT NULL';
    END IF;

    -- Add details column if it doesn't exist (for storing json data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'campaigns' AND column_name = 'details') THEN
        ALTER TABLE public.campaigns ADD COLUMN details JSONB;
    END IF;
END $$;
