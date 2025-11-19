"use client";

import { useState, useRef, useEffect } from 'react';
import type { Database } from '@/lib/supabase/database.types';

type TrainingSession = Database['public']['Tables']['navigation_training_sessions']['Row'];
type ADBCommand = {
  type: 'tap' | 'swipe' | 'key' | 'text' | 'wait';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  duration?: number;
  keycode?: number;
  text?: string;
  description?: string;
  timestamp?: string;
};

interface TrainingClientProps {
  deviceId?: string;
}

export function TrainingClient({ deviceId = '127.0.0.1:5555' }: TrainingClientProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [trainingSessionId, setTrainingSessionId] = useState<string | null>(null);
  const [initialScreenshot, setInitialScreenshot] = useState<string | null>(null);
  const [recordedActions, setRecordedActions] = useState<ADBCommand[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [initialGameState, setInitialGameState] = useState('unknown');
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPatternDialog, setShowPatternDialog] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');

  // Start training session
  const handleStartTraining = async () => {
    try {
      const response = await fetch('/api/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_name: sessionName || `Training ${new Date().toLocaleString()}`,
          device_id: deviceId,
          initial_game_state: initialGameState
        })
      });

      const data = await response.json();

      if (data.success) {
        setTrainingSessionId(data.training_session.id);
        setInitialScreenshot(data.training_session.screenshot_url);
        setIsRecording(true);
        setRecordedActions([]);
      } else {
        alert(`Failed to start training: ${data.error}`);
      }
    } catch (error) {
      console.error('Start training error:', error);
      alert('Failed to start training session');
    }
  };

  // Record an action
  const handleRecordAction = async (action: ADBCommand) => {
    if (!trainingSessionId || !isRecording) return;

    try {
      // Execute action via ADB
      const navResponse = await fetch('/api/adb/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          command: action
        })
      });

      const navData = await navResponse.json();

      // Record action in training session
      const recordResponse = await fetch('/api/training/record-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_session_id: trainingSessionId,
          action: {
            ...action,
            description: action.description || `${action.type} at ${action.x},${action.y}`,
            execution_success: navData.success
          }
        })
      });

      const recordData = await recordResponse.json();

      if (recordData.success) {
        setRecordedActions([...recordedActions, action]);
      }
    } catch (error) {
      console.error('Record action error:', error);
    }
  };

  // Quick action buttons
  const handleQuickAction = (type: 'tap' | 'swipe' | 'key', params?: any) => {
    if (!isRecording) {
      alert('Start a training session first');
      return;
    }

    let action: ADBCommand = { type };

    if (type === 'tap') {
      action = { type: 'tap', x: params.x || 960, y: params.y || 540, description: `Tap at ${params.x || 960},${params.y || 540}` };
    } else if (type === 'swipe') {
      action = {
        type: 'swipe',
        x1: params.x1 || 960,
        y1: params.y1 || 540,
        x2: params.x2 || 960,
        y2: params.y2 || 340,
        duration: params.duration || 300,
        description: `Swipe from ${params.x1 || 960},${params.y1 || 540} to ${params.x2 || 960},${params.y2 || 340}`
      };
    } else if (type === 'key') {
      action = { type: 'key', keycode: params.keycode || 4, description: `Press key ${params.keycode || 4}` };
    }

    handleRecordAction(action);
  };

  // Complete training session
  const handleCompleteTraining = async (createPattern: boolean) => {
    if (!trainingSessionId) return;

    setIsCompleting(true);
    try {
      // Capture final screenshot
      const screenshotResponse = await fetch('/api/screenshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          game_state: 'unknown'
        })
      });

      const screenshotData = await screenshotResponse.json();
      const finalScreenshotId = screenshotData.success ? screenshotData.screenshot.id : null;

      // Complete training session
      const response = await fetch('/api/training/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_session_id: trainingSessionId,
          pattern_name: createPattern ? patternName : null,
          pattern_description: createPattern ? patternDescription : null,
          final_screenshot_id: finalScreenshotId,
          final_game_state: 'unknown',
          success: true,
          create_pattern: createPattern
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(createPattern ? `Pattern "${patternName}" created successfully!` : 'Training session completed!');
        // Reset state
        setIsRecording(false);
        setTrainingSessionId(null);
        setInitialScreenshot(null);
        setRecordedActions([]);
        setShowPatternDialog(false);
      } else {
        alert(`Failed to complete training: ${data.error}`);
      }
    } catch (error) {
      console.error('Complete training error:', error);
      alert('Failed to complete training session');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Navigation Training</h1>

      {/* Training Setup */}
      {!isRecording && (
        <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.2)', background: '#111827', marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Start Training Session</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                Session Name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Navigate to Coordinate"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: '#1e293b',
                  color: '#e2e8f0'
                }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                Initial Game State
              </label>
              <select
                value={initialGameState}
                onChange={(e) => setInitialGameState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: '#1e293b',
                  color: '#e2e8f0'
                }}
              >
                <option value="unknown">Unknown</option>
                <option value="menu">Menu</option>
                <option value="map">Map</option>
                <option value="castle">Castle</option>
                <option value="scout">Scout</option>
                <option value="battle">Battle</option>
              </select>
            </div>
            <button
              onClick={handleStartTraining}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: '#15803d',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🎬 Start Recording
            </button>
          </div>
        </div>
      )}

      {/* Recording Interface */}
      {isRecording && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Initial Screenshot */}
          {initialScreenshot && (
            <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.2)', background: '#111827' }}>
              <h3 style={{ marginBottom: '1rem' }}>Initial Screenshot</h3>
              <img
                src={initialScreenshot}
                alt="Initial state"
                style={{ maxWidth: '100%', borderRadius: '0.5rem', border: '1px solid rgba(148, 163, 184, 0.2)' }}
              />
            </div>
          )}

          {/* Action Controls */}
          <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.2)', background: '#111827' }}>
            <h3 style={{ marginBottom: '1rem' }}>Record Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={() => handleQuickAction('tap', { x: 960, y: 540 })}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  background: '#15803d',
                  color: '#e2e8f0',
                  cursor: 'pointer'
                }}
              >
                📍 Tap Center
              </button>
              <button
                onClick={() => handleQuickAction('swipe', { x1: 960, y1: 540, x2: 960, y2: 340 })}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  background: '#15803d',
                  color: '#e2e8f0',
                  cursor: 'pointer'
                }}
              >
                👆 Swipe Up
              </button>
              <button
                onClick={() => handleQuickAction('key', { keycode: 4 })}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  background: '#15803d',
                  color: '#e2e8f0',
                  cursor: 'pointer'
                }}
              >
                ⬅️ Back Button
              </button>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Recorded {recordedActions.length} actions
            </div>
          </div>

          {/* Recorded Actions List */}
          {recordedActions.length > 0 && (
            <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.2)', background: '#111827' }}>
              <h3 style={{ marginBottom: '1rem' }}>Recorded Actions</h3>
              <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                {recordedActions.map((action, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: '#0f172a',
                      border: '1px solid rgba(148, 163, 184, 0.2)'
                    }}
                  >
                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {idx + 1}. {action.type.toUpperCase()}
                    </div>
                    {action.description && (
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{action.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Training */}
          <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(148, 163, 184, 0.2)', background: '#111827' }}>
            <h3 style={{ marginBottom: '1rem' }}>Complete Training</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleCompleteTraining(false)}
                disabled={isCompleting}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: isCompleting ? '#475569' : '#1e293b',
                  color: '#e2e8f0',
                  cursor: isCompleting ? 'not-allowed' : 'pointer'
                }}
              >
                Complete Session
              </button>
              <button
                onClick={() => setShowPatternDialog(true)}
                disabled={isCompleting}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  background: isCompleting ? '#475569' : '#15803d',
                  color: '#e2e8f0',
                  cursor: isCompleting ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                💾 Save as Pattern
              </button>
            </div>
          </div>

          {/* Pattern Dialog */}
          {showPatternDialog && (
            <div style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.1)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Create Pattern</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                    Pattern Name
                  </label>
                  <input
                    type="text"
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    placeholder="e.g., Navigate to Coordinate"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#1e293b',
                      color: '#e2e8f0'
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                    Description
                  </label>
                  <textarea
                    value={patternDescription}
                    onChange={(e) => setPatternDescription(e.target.value)}
                    placeholder="Describe what this pattern does..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#1e293b',
                      color: '#e2e8f0'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleCompleteTraining(true)}
                  disabled={isCompleting || !patternName}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: isCompleting || !patternName ? '#475569' : '#15803d',
                    color: '#e2e8f0',
                    cursor: isCompleting || !patternName ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  Create Pattern
                </button>
                <button
                  onClick={() => setShowPatternDialog(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: '#1e293b',
                    color: '#e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

