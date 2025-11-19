import { NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

/**
 * ADB Navigation API
 * Executes ADB commands to navigate the game interface
 */

interface ADBCommand {
  type: 'tap' | 'swipe' | 'key' | 'text' | 'wait' | 'sequence';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  duration?: number;
  keycode?: number;
  text?: string;
  commands?: ADBCommand[];
  delay?: number;
}

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
    const { device_id, command, sequence } = body;

    const deviceId = device_id || '127.0.0.1:5555';
    const warbotApiUrl = process.env.WARBOT_API_URL || 'http://localhost:8000';

    // Execute single command or sequence
    if (sequence && Array.isArray(sequence)) {
      // Execute command sequence
      const results = [];
      for (const cmd of sequence) {
        const result = await executeCommand(warbotApiUrl, deviceId, cmd);
        results.push(result);
        
        // Add delay between commands if specified
        if (cmd.delay && cmd.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, cmd.delay));
        }
      }
      
      return NextResponse.json({
        success: true,
        results,
        executed: results.length
      });
    } else if (command) {
      // Execute single command
      const result = await executeCommand(warbotApiUrl, deviceId, command);
      
      return NextResponse.json({
        success: result.success,
        result,
        error: result.error
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'No command or sequence provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('ADB navigation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function executeCommand(
  warbotApiUrl: string,
  deviceId: string,
  command: ADBCommand
): Promise<{ success: boolean; type: string; error?: string; result?: any }> {
  try {
    const response = await fetch(`${warbotApiUrl}/api/adb/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WARBOT_API_KEY || ''}`
      },
      body: JSON.stringify({
        device_id: deviceId,
        command
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, type: command.type, error };
    }

    const data = await response.json();
    return { success: true, type: command.type, result: data };
  } catch (error) {
    // Fallback: execute directly if warbot API unavailable
    return await executeDirectCommand(deviceId, command);
  }
}

async function executeDirectCommand(
  deviceId: string,
  command: ADBCommand
): Promise<{ success: boolean; type: string; error?: string; result?: any }> {
  // This would require server-side ADB access
  // For now, return error suggesting warbot API setup
  return {
    success: false,
    type: command.type,
    error: 'Warbot API not available. Please ensure WARBOT_API_URL is configured.'
  };
}

