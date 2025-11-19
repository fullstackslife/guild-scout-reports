import { NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

/**
 * Record an action during training
 * Stores the action in the training session
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
    const { training_session_id, action, screenshot_id } = body;

    if (!training_session_id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing training_session_id or action' },
        { status: 400 }
      );
    }

    // Get current training session
    const { data: sessionData, error: sessionError } = await supabase
      .from('navigation_training_sessions')
      .select('recorded_actions, action_count')
      .eq('id', training_session_id)
      .eq('user_id', session.user.id)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { success: false, error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Add action to recorded actions
    const actions = sessionData.recorded_actions || [];
    const newAction = {
      ...action,
      timestamp: new Date().toISOString(),
      screenshot_id: screenshot_id || null
    };
    actions.push(newAction);

    // Update training session
    const { error: updateError } = await supabase
      .from('navigation_training_sessions')
      .update({
        recorded_actions: actions,
        action_count: actions.length
      })
      .eq('id', training_session_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Update error: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action_recorded: newAction,
      total_actions: actions.length
    });
  } catch (error) {
    console.error('Record action error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

