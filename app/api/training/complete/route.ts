import { NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

/**
 * Complete a training session and create a pattern
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
      training_session_id,
      pattern_name,
      pattern_description,
      final_screenshot_id,
      final_game_state,
      success,
      notes,
      create_pattern
    } = body;

    if (!training_session_id) {
      return NextResponse.json(
        { success: false, error: 'Missing training_session_id' },
        { status: 400 }
      );
    }

    // Get training session
    const { data: trainingSession, error: sessionError } = await supabase
      .from('navigation_training_sessions')
      .select('*, screenshots!navigation_training_sessions_screenshot_id_fkey(*)')
      .eq('id', training_session_id)
      .eq('user_id', session.user.id)
      .single();

    if (sessionError || !trainingSession) {
      return NextResponse.json(
        { success: false, error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Calculate duration
    const startTime = new Date(trainingSession.created_at);
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update training session
    const { error: updateError } = await supabase
      .from('navigation_training_sessions')
      .update({
        final_screenshot_id: final_screenshot_id || null,
        final_game_state: final_game_state || null,
        success: success !== undefined ? success : null,
        notes: notes || null,
        duration_seconds: durationSeconds
      })
      .eq('id', training_session_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Update error: ${updateError.message}` },
        { status: 500 }
      );
    }

    let patternId = null;

    // Create pattern if requested
    if (create_pattern && pattern_name) {
      const initialScreenshot = trainingSession.screenshots;
      const actions = trainingSession.recorded_actions || [];

      // Extract features from screenshot (simplified - would use OCR/vision in production)
      const matchFeatures = {
        game_state: trainingSession.initial_game_state,
        action_count: actions.length,
        action_types: [...new Set(actions.map((a: any) => a.type))]
      };

      const { data: pattern, error: patternError } = await supabase
        .from('navigation_patterns')
        .insert({
          user_id: session.user.id,
          name: pattern_name,
          description: pattern_description || `Pattern learned from training session ${training_session_id}`,
          pattern_type: 'screen_match',
          template_screenshot_id: trainingSession.screenshot_id,
          match_features: matchFeatures,
          actions: actions,
          action_sequence: actions.map((a: any) => a.description || a.type).join(' → '),
          expected_game_state: trainingSession.initial_game_state,
          training_sessions: 1,
          success_count: success ? 1 : 0,
          failure_count: success ? 0 : 1,
          is_active: true,
          confidence_score: 0.50
        })
        .select()
        .single();

      if (patternError) {
        console.error('Pattern creation error:', patternError);
        // Continue even if pattern creation fails
      } else {
        patternId = pattern.id;

        // Link training session to pattern
        await supabase
          .from('navigation_training_sessions')
          .update({ pattern_id: patternId })
          .eq('id', training_session_id);
      }
    }

    return NextResponse.json({
      success: true,
      training_session: {
        id: training_session_id,
        completed: true,
        duration_seconds: durationSeconds,
        pattern_id: patternId
      }
    });
  } catch (error) {
    console.error('Training complete error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

