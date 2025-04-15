import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Execute SQL statements one by one using fetch directly
async function executeStatements(sql) {
  // Split by semicolons, and filter out empty statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    try {
      console.log(`Executing statement ${successCount + errorCount + 1}/${statements.length}...`);
      
      // Use the REST SQL endpoint directly
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'resolution=ignore-duplicates,return=minimal'
        },
        body: JSON.stringify({
          query: statement
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SQL error: ${response.status} - ${errorText}`);
        errorCount++;
      } else {
        console.log('Statement executed successfully');
        successCount++;
      }
    } catch (stmtError) {
      console.error(`Error executing statement: ${stmtError}`);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Create templates table in smaller steps
async function createTemplatesTable() {
  try {
    // Read the templates SQL
    const sqlPath = path.resolve(__dirname, '../sql/create_templates_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing templates table SQL...');
    
    // First, check if the templates table already exists
    const { data, error } = await supabase
      .from('templates')
      .select('count(*)', { count: 'exact', head: true });
    
    if (!error) {
      console.log('Templates table already exists. Checking for rows...');
      
      // If the table has rows, skip creation
      if (data && data.count > 0) {
        console.log(`Templates table already has ${data.count} rows. Skipping creation.`);
        return { success: true, message: 'Templates table already exists with data' };
      }
    }
    
    // Try direct statement execution
    const result = await executeStatements(sql);
    
    if (result.errorCount === 0) {
      console.log(`✅ All ${result.successCount} statements executed successfully.`);
      return { success: true, message: 'Templates table created successfully' };
    } else {
      console.warn(`⚠️ ${result.successCount} statements succeeded, ${result.errorCount} failed.`);
      
      // Try to check if the table exists now
      const { data, error } = await supabase
        .from('templates')
        .select('count(*)', { count: 'exact', head: true });
      
      if (!error) {
        console.log('Templates table was created despite some errors.');
        return { success: true, message: 'Templates table created with some errors' };
      }
      
      return { 
        success: false, 
        message: `Failed to create templates table: ${result.errorCount} statements failed` 
      };
    }
  } catch (error) {
    console.error('Error creating templates table:', error);
    return { success: false, message: 'Error: ' + (error.message || 'Unknown error') };
  }
}

// Simpler approach: Just create the table structure without the data first
async function createJustTheTable() {
  try {
    // Create just the templates table structure
    const createTableSQL = `
      -- Create templates table for storing ad templates
      CREATE TABLE IF NOT EXISTS public.templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        preview_text TEXT NOT NULL,
        category TEXT,
        tier TEXT DEFAULT 'basic', -- basic, starter, pro
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Set up Row Level Security
      ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

      -- Policies for read access
      CREATE POLICY IF NOT EXISTS "Everyone can read templates" ON public.templates
        FOR SELECT USING (true);

      -- Policy for service role (important for backend operations)
      CREATE POLICY IF NOT EXISTS "Service role can manage templates" ON public.templates
        FOR ALL USING (true);

      -- Grant read permissions to authenticated users
      GRANT SELECT ON public.templates TO authenticated;

      -- Grant full permissions to service role
      GRANT ALL ON public.templates TO service_role;
    `;
    
    // Try direct statement execution
    const result = await executeStatements(createTableSQL);
    
    if (result.errorCount === 0) {
      console.log(`✅ Table structure created successfully.`);
      return { success: true };
    } else {
      console.warn(`⚠️ Table structure creation had errors.`);
      return { success: false };
    }
  } catch (error) {
    console.error('Error creating templates table structure:', error);
    return { success: false };
  }
}

// Insert template data directly
async function insertTemplateData() {
  try {
    // Basic tier templates
    const basicTemplates = [
      {
        name: 'Product Announcement',
        description: 'Announce a new product or feature with this template',
        preview_text: 'Introducing [Product]: The [adjective] solution for [target audience].',
        category: 'product',
        tier: 'basic'
      },
      {
        name: 'Special Offer',
        description: 'Promote a limited-time discount or special offer',
        preview_text: 'For a limited time: Get [discount]% off on [product/service]. Don\'t miss out!',
        category: 'promotion',
        tier: 'basic'
      },
      {
        name: 'Testimonial Highlight',
        description: 'Showcase customer testimonials to build trust',
        preview_text: '"[Product] helped me achieve [benefit]. Highly recommended!" - [Customer Name]',
        category: 'testimonial',
        tier: 'basic'
      },
      {
        name: 'Problem-Solution',
        description: 'Address a pain point and present your solution',
        preview_text: 'Tired of [problem]? [Product] is the solution you\'ve been looking for.',
        category: 'problem-solution',
        tier: 'basic'
      },
      {
        name: 'Feature Highlight',
        description: 'Focus on a specific feature and its benefits',
        preview_text: 'Our [feature] helps you [benefit] so you can [desired outcome].',
        category: 'feature',
        tier: 'basic'
      }
    ];
    
    // Starter tier templates
    const starterTemplates = [
      {
        name: 'Seasonal Promotion',
        description: 'Tie your offer to a season or holiday',
        preview_text: 'This [season/holiday], treat yourself to [product/service] and enjoy [benefit].',
        category: 'seasonal',
        tier: 'starter'
      },
      {
        name: 'Comparison Ad',
        description: 'Highlight how your product compares to alternatives',
        preview_text: 'Why choose [Product]? Unlike [alternatives], we offer [unique benefits].',
        category: 'comparison',
        tier: 'starter'
      },
      {
        name: 'FOMO (Fear of Missing Out)',
        description: 'Create urgency with limited availability',
        preview_text: 'Only [number] left! Get your [product] before they\'re gone.',
        category: 'urgency',
        tier: 'starter'
      },
      {
        name: 'Facts & Statistics',
        description: 'Use compelling stats to build credibility',
        preview_text: '[Percentage]% of customers report [positive outcome] after using [product].',
        category: 'statistics',
        tier: 'starter'
      },
      {
        name: 'How-To Guide',
        description: 'Provide valuable information and education',
        preview_text: 'How to [achieve goal] in [timeframe] using [product/service].',
        category: 'educational',
        tier: 'starter'
      }
    ];
    
    // Pro tier templates
    const proTemplates = [
      {
        name: 'Story-Based Narrative',
        description: 'Engage with a compelling story format',
        preview_text: 'Meet [character]. They struggled with [problem] until they discovered [product].',
        category: 'story',
        tier: 'pro'
      },
      {
        name: 'Interactive Quiz',
        description: 'Engage users with an interactive element',
        preview_text: 'Find out which [product] is right for you with our 30-second quiz.',
        category: 'interactive',
        tier: 'pro'
      },
      {
        name: 'Industry-Specific',
        description: 'Templates tailored to your specific industry',
        preview_text: 'The only [industry-specific product] designed by [industry professionals].',
        category: 'industry',
        tier: 'pro'
      },
      {
        name: 'Video Script',
        description: 'Ready-to-use scripts for video ads',
        preview_text: '[Opening hook]: Are you tired of [problem]? [Solution]: Our [product] can help.',
        category: 'video',
        tier: 'pro'
      },
      {
        name: 'Social Proof Bundle',
        description: 'Combine reviews, testimonials, and case studies',
        preview_text: 'Join over [number] satisfied customers who\'ve achieved [benefit] with [product].',
        category: 'social-proof',
        tier: 'pro'
      }
    ];
    
    // Insert basic templates
    const { data: basicData, error: basicError } = await supabase
      .from('templates')
      .insert(basicTemplates)
      .select();
    
    if (basicError) {
      console.error('Error inserting basic templates:', basicError);
    } else {
      console.log(`✅ Successfully inserted ${basicData.length} basic templates.`);
    }
    
    // Insert starter templates
    const { data: starterData, error: starterError } = await supabase
      .from('templates')
      .insert(starterTemplates)
      .select();
    
    if (starterError) {
      console.error('Error inserting starter templates:', starterError);
    } else {
      console.log(`✅ Successfully inserted ${starterData.length} starter templates.`);
    }
    
    // Insert pro templates
    const { data: proData, error: proError } = await supabase
      .from('templates')
      .insert(proTemplates)
      .select();
    
    if (proError) {
      console.error('Error inserting pro templates:', proError);
    } else {
      console.log(`✅ Successfully inserted ${proData.length} pro templates.`);
    }
    
    // Check for any errors
    if (basicError || starterError || proError) {
      return { 
        success: false, 
        message: 'Some template data could not be inserted' 
      };
    }
    
    return { 
      success: true, 
      message: 'All template data inserted successfully' 
    };
  } catch (error) {
    console.error('Error inserting template data:', error);
    return { 
      success: false, 
      message: 'Error: ' + (error.message || 'Unknown error') 
    };
  }
}

// Main function
async function main() {
  console.log('Creating templates table in Supabase...');
  
  // First, create just the table structure
  const structureResult = await createJustTheTable();
  
  if (structureResult.success) {
    // Then insert the data
    const dataResult = await insertTemplateData();
    
    if (dataResult.success) {
      console.log('✅ Templates table created and populated successfully.');
    } else {
      console.warn('⚠️ Templates table created but data population had issues.');
      console.log('You may need to manually insert template data in the SQL Editor.');
    }
  } else {
    // If direct approach fails, try the full SQL approach
    console.log('Trying alternative approach to create templates table...');
    
    const result = await createTemplatesTable();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
      console.log('\nYou may need to create this table manually in the SQL Editor.');
    }
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 