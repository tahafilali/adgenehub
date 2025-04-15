export interface AdGenerationConfig {
  template: string;
  productDescription: string;
  targetAudience: string;
  tone: string;
  numberOfVariants?: number;
}

/**
 * Generate ad content using Google Gemini API
 */
export async function generateAdContent({
  template,
  productDescription,
  targetAudience,
  tone,
  numberOfVariants = 3
}: AdGenerationConfig): Promise<string[]> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API key is not configured');
  }

  // Replace template placeholders with actual content
  let filledTemplate = template;
  
  if (productDescription) {
    filledTemplate = filledTemplate.replace(/\[product\]/gi, productDescription);
  }
  
  if (targetAudience) {
    filledTemplate = filledTemplate.replace(/\[target audience\]/gi, targetAudience);
  }

  // Construct the prompt
  const prompt = `
    You are an expert copywriter. I need you to create ${numberOfVariants} variations of ad copy based on the following template and information:
    
    Template: "${filledTemplate}"
    
    Product/Service: ${productDescription || "[No product description provided]"}
    Target Audience: ${targetAudience || "[No target audience provided]"}
    Tone: ${tone || "professional"}
    
    Please replace any placeholders in the template with appropriate content that fits the product and audience.
    Each ad should be a complete and polished piece of copy ready for use in advertising.
    Each ad should be different but maintain the same basic structure of the template.
    Keep ads concise, compelling, and focused on benefits to the target audience.
    
    Format your response as an array of ${numberOfVariants} distinct ad variants, with no additional text.
  `;

  // Generate content with direct API call
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GOOGLE_AI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const responseText = data.candidates[0].content.parts[0].text;
  
  // Extract the ad variants from the response
  let adVariants: string[] = [];
  try {
    // Check if response is already in array format
    if (responseText.trim().startsWith('[') && responseText.trim().endsWith(']')) {
      adVariants = JSON.parse(responseText);
    } else {
      // Otherwise split by empty lines
      adVariants = responseText
        .split(/(?:\r?\n){2,}/)
        .filter((ad: string) => ad.trim().length > 0)
        .slice(0, numberOfVariants);
    }
    
    // Ensure we have at least one variant
    if (adVariants.length === 0) {
      adVariants = [responseText];
    }
    
    // Limit to requested number of variants
    adVariants = adVariants.slice(0, numberOfVariants);
  } catch (error) {
    console.error('Error parsing AI response:', error);
    adVariants = [responseText]; // Fallback to using the whole response
  }
  
  return adVariants;
}

/**
 * Generate an improved version of an existing ad
 */
export async function improveAdContent(
  currentContent: string,
  targetAudience: string,
  productDescription: string,
  tone: string
): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API key is not configured');
  }

  // Construct the prompt
  const prompt = `
    You are an expert copywriter. I need you to improve the following ad copy:
    
    Current Ad: "${currentContent}"
    
    Product/Service: ${productDescription || "[No product description provided]"}
    Target Audience: ${targetAudience || "[No target audience provided]"}
    Tone: ${tone || "professional"}
    
    Please enhance this ad to make it more compelling and effective while maintaining its core message.
    Focus on making it more engaging, persuasive, and better targeted to the audience.
    Keep it concise and impactful.
    
    Return only the improved ad with no additional text or explanation.
  `;

  // Generate improved content with direct API call
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GOOGLE_AI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  const responseText = data.candidates[0].content.parts[0].text;
  
  return responseText.trim();
} 