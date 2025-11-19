import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API endpoint to trigger screenshot capture via ADB/warbot
 * This integrates with the warbot system to capture screenshots from BlueStacks
 */
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      coordinate_k,
      coordinate_x,
      coordinate_y,
      game_state,
      device_id,
      label
    } = body;

    // Call warbot ADB service to capture screenshot
    const warbotApiUrl = process.env.WARBOT_API_URL || 'http://localhost:8000';
    const captureResponse = await fetch(`${warbotApiUrl}/api/capture/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WARBOT_API_KEY || ''}`
      },
      body: JSON.stringify({
        device_id: device_id || '127.0.0.1:5555',
        coordinate_k,
        coordinate_x,
        coordinate_y,
        game_state
      })
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      return NextResponse.json(
        { success: false, error: `Warbot capture failed: ${error}` },
        { status: captureResponse.status }
      );
    }

    const captureData = await captureResponse.json();
    
    // Upload screenshot to Supabase Storage
    const screenshotFile = await fetch(captureData.screenshot_url).then(r => r.blob());
    const fileExt = 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(filePath, screenshotFile, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath);

    // Create screenshot record
    const { data: screenshot, error: screenshotError } = await supabase
      .from('screenshots')
      .insert({
        user_id: session.user.id,
        file_path: filePath,
        label: label || `Capture at ${coordinate_k}:${coordinate_x}:${coordinate_y}`,
        game_state: game_state || 'unknown',
        coordinate_k,
        coordinate_x,
        coordinate_y,
        capture_method: 'adb',
        capture_source: 'warbot',
        device_id: device_id || '127.0.0.1:5555',
        processing_status: 'pending'
      })
      .select()
      .single();

    if (screenshotError) {
      return NextResponse.json(
        { success: false, error: `Database error: ${screenshotError.message}` },
        { status: 500 }
      );
    }

    // Create game state history entry
    if (coordinate_k && coordinate_x && coordinate_y) {
      await supabase
        .from('coordinate_game_states')
        .insert({
          coordinate_k,
          coordinate_x,
          coordinate_y,
          screenshot_id: screenshot.id,
          game_state: game_state || 'unknown',
          target_name: captureData.extracted_data?.target_name,
          target_guild: captureData.extracted_data?.target_guild,
          might: captureData.extracted_data?.might,
          metadata: captureData.extracted_data || {}
        });
    }

    return NextResponse.json({
      success: true,
      screenshot: {
        id: screenshot.id,
        url: urlData.publicUrl,
        game_state: screenshot.game_state,
        coordinates: {
          k: coordinate_k,
          x: coordinate_x,
          y: coordinate_y
        }
      }
    });
  } catch (error) {
    console.error('Screenshot capture error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

