import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// Initialize the Google Generative AI client with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Get the model - we'll use gemini-pro for text generation
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  } as GenerationConfig
});

// Type for ad generation parameters
export type AdGenerationParams = {
  businessName: string;
  industry: string;
  productOrService: string;
  targetAudience: string;
  keyFeatures: string[];
  platforms: string[];
  toneOfVoice: string;
  adType: 'headline' | 'description' | 'full_ad';
  existingBrandVoice?: string;
  campaignGoals?: string;
  callToAction?: string;
  maxLength?: number;
  variations?: number;
};

/**
 * Generates ad content using Google's Gemini AI model
 */
export async function generateAdContent(params: AdGenerationParams): Promise<string[]> {
  try {
    // Build a detailed prompt based on the parameters
    const prompt = buildAdGenerationPrompt(params);
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the response into variations
    return parseVariations(text, params.variations || 1);
  } catch (error) {
    console.error('Error generating ad content:', error);
    throw new Error('Failed to generate ad content. Please try again.');
  }
}

/**
 * Builds a detailed prompt for ad generation based on provided parameters
 */
function buildAdGenerationPrompt(params: AdGenerationParams): string {
  const {
    businessName,
    industry,
    productOrService,
    targetAudience,
    keyFeatures,
    platforms,
    toneOfVoice,
    adType,
    existingBrandVoice,
    campaignGoals,
    callToAction,
    maxLength,
    variations
  } = params;

  // Base prompt
  let prompt = `Generate ${variations || 1} persuasive and engaging ${adType} for ${businessName}, a business in the ${industry} industry. `;
  
  // Add product/service details
  prompt += `The ad is for ${productOrService}. `;
  
  // Add target audience
  prompt += `The target audience is ${targetAudience}. `;
  
  // Add key features
  if (keyFeatures && keyFeatures.length > 0) {
    prompt += `Key features to highlight include: ${keyFeatures.join(', ')}. `;
  }
  
  // Add platforms
  if (platforms && platforms.length > 0) {
    prompt += `The ad will be shown on the following platforms: ${platforms.join(', ')}. `;
  }
  
  // Add tone of voice
  prompt += `Use a ${toneOfVoice} tone of voice. `;
  
  // Add existing brand voice if available
  if (existingBrandVoice) {
    prompt += `Match this existing brand voice: "${existingBrandVoice}". `;
  }
  
  // Add campaign goals if available
  if (campaignGoals) {
    prompt += `The goal of this campaign is: ${campaignGoals}. `;
  }
  
  // Add call to action if available
  if (callToAction) {
    prompt += `Include this call to action: ${callToAction}. `;
  }
  
  // Specify content type and length requirements
  if (adType === 'headline') {
    prompt += `Create attention-grabbing headlines that are concise and impactful. `;
    prompt += `Keep headlines under ${maxLength || 65} characters. `;
  } else if (adType === 'description') {
    prompt += `Create compelling ad descriptions that highlight benefits and features. `;
    prompt += `Keep descriptions under ${maxLength || 150} characters. `;
  } else if (adType === 'full_ad') {
    prompt += `Create a complete ad with headline, description, and call to action. `;
    prompt += `Keep the total length appropriate for ${platforms.join(', ')}. `;
  }
  
  // Format instruction
  if (variations && variations > 1) {
    prompt += `Format each variation on a new line starting with "Variation {number}:". Provide exactly ${variations} variations.`;
  }

  return prompt;
}

/**
 * Parses the response from Gemini into separate variations
 */
function parseVariations(text: string, variationCount: number): string[] {
  if (variationCount === 1) {
    return [text.trim()];
  }
  
  // Try to parse out the variations
  const variations: string[] = [];
  const lines = text.split('\n');
  
  let currentVariation = '';
  let variationIndex = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this line starts a new variation
    if (/^Variation \d+:|^\d+\./.test(trimmedLine)) {
      if (currentVariation) {
        variations.push(currentVariation.trim());
        currentVariation = '';
      }
      
      // Start a new variation with the content after the label
      const contentAfterLabel = trimmedLine.replace(/^Variation \d+:|^\d+\./, '').trim();
      currentVariation = contentAfterLabel;
    } else if (currentVariation || variations.length === 0) {
      // If we're in a variation or haven't started one yet, add this line
      if (currentVariation) {
        currentVariation += ' ' + trimmedLine;
      } else {
        currentVariation = trimmedLine;
      }
    }
  }
  
  // Add the last variation if there is one
  if (currentVariation) {
    variations.push(currentVariation.trim());
  }
  
  // If parsing failed, just split evenly or return the whole text
  if (variations.length === 0) {
    return [text.trim()];
  } else if (variations.length < variationCount) {
    // If we have fewer variations than requested, duplicate the last one
    while (variations.length < variationCount) {
      variations.push(variations[variations.length - 1]);
    }
  } else if (variations.length > variationCount) {
    // If we have more variations than requested, truncate
    variations.length = variationCount;
  }
  
  return variations;
} 