import { NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

/**
 * Start a training session
 * Captures initial screenshot and sets up recording
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
    const { session_name, device_id, initial_game_state } = body;

    const deviceId = device_id || '127.0.0.1:5555';
    const warbotApiUrl = process.env.WARBOT_API_URL || 'http://localhost:8000';

    // Capture initial screenshot
    const screenshotResponse = await fetch(`${warbotApiUrl}/api/capture/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WARBOT_API_KEY || ''}`
      },
      body: JSON.stringify({
        device_id: deviceId,
        game_state: initial_game_state || 'unknown'
      })
    });

    if (!screenshotResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to capture initial screenshot' },
        { status: 500 }
      );
    }

    const screenshotData = await screenshotResponse.json();
    
    // Upload screenshot to Supabase Storage
    const screenshotFile = await fetch(screenshotData.screenshot_url).then(r => r.blob());
    const fileExt = 'png';
    const fileName = `training-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
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

    // Create screenshot record
    const { data: screenshot, error: screenshotError } = await supabase
      .from('screenshots')
      .insert({
        user_id: session.user.id,
        file_path: filePath,
        label: session_name || 'Training session',
        game_state: initial_game_state || 'unknown',
        capture_method: 'adb',
        capture_source: 'training',
        device_id: deviceId,
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

    // Create training session
    const { data: trainingSession, error: trainingError } = await supabase
      .from('navigation_training_sessions')
      .insert({
        user_id: session.user.id,
        session_name: session_name || `Training ${new Date().toISOString()}`,
        screenshot_id: screenshot.id,
        initial_game_state: initial_game_state || 'unknown',
        recorded_actions: [],
        action_count: 0
      })
      .select()
      .single();

    if (trainingError) {
      return NextResponse.json(
        { success: false, error: `Training session error: ${trainingError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      training_session: {
        id: trainingSession.id,
        screenshot_id: screenshot.id,
        screenshot_url: screenshotData.screenshot_url,
        started_at: trainingSession.created_at
      }
    });
  } catch (error) {
    console.error('Training start error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

