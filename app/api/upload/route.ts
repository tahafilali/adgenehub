import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-server';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST endpoint to upload media files to Supabase storage
 */
export async function POST(req: NextRequest) {
  try {
    // Only accept multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'image';
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get file metadata
    const filename = file.name;
    const contentType = file.type;
    
    // Get file content
    const buffer = await file.arrayBuffer();
    
    // Ensure the file is an image or video based on type
    if (type === 'image' && !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    if (type === 'video' && !contentType.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 });
    }
    
    // Generate unique filename
    const extension = filename.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${extension}`;
    
    // Initialize Supabase client
    const supabase = createSupabaseAdmin();
    
    // Upload file to Supabase Storage
    const bucket = type === 'image' ? 'ad-images' : 'ad-videos';
    const path = `${userId}/${uniqueFilename}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: false
      });
    
    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path,
      bucket,
      type 
    });
  } catch (error) {
    console.error('Unexpected error during file upload:', error);
    return NextResponse.json({ 
      error: 'Unexpected error during upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 