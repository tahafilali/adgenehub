import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure you have GOOGLE_API_KEY in your environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = createServerSupabaseClient({ req, res });

  try {
    // 1. Check Authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('API Auth Error:', sessionError);
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = session.user;
    // Placeholder to use the user variable until authorization is implemented
    // console.log('API request by user:', user.id); // Keep this commented or remove if not needed

    // 2. Check Authorization - Fetch user profile and check plan
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('active_plan')
      .eq('auth_id', user.id) // Match based on the auth.users ID linked in your users table
      .single();

    if (profileError) {
      console.error('API Authorization - Profile Fetch Error:', profileError);
      return res.status(500).json({ error: 'Could not verify user plan', details: profileError.message });
    }

    if (!profile) {
        console.error(`API Authorization - Profile not found for user: ${user.id}`);
        return res.status(403).json({ error: 'Forbidden: User profile not found.' });
    }

    if (profile.active_plan !== 'pro') {
      console.log(`API Authorization - Plan check failed for user ${user.id}. Plan: ${profile.active_plan}`);
      return res.status(403).json({ error: 'Forbidden: Pro plan required for AI generation.' });
    }

    console.log(`User ${user.id} with plan ${profile.active_plan} authorized for Gemini API.`);

    // 3. Get Prompt from Request Body
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt provided in request body' });
    }

    // 4. Call Gemini API
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Return Result
    return res.status(200).json({ generatedText: text });

  } catch (error: unknown) {
    console.error('Gemini API Route Error:', error);
    let errorMessage = 'Failed to generate content';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Consider more specific error handling based on Gemini API errors
    return res.status(500).json({ error: 'Failed to generate content', details: errorMessage });
  }
} 