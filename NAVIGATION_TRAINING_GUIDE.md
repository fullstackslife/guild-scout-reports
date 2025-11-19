# Navigation Training System Guide

## Overview
The Navigation Training System allows you to teach the system navigation patterns by recording your actions. The system learns from screenshots and your navigation actions to create reusable patterns that can automatically navigate the game.

## How It Works

1. **Start Training Session**: Capture initial screenshot
2. **Record Actions**: Perform navigation (taps, swipes, etc.) - system records everything
3. **Complete Training**: Save as a pattern for future use
4. **Pattern Matching**: System uses patterns to automatically navigate when it sees similar screens

## Workflow

### Step 1: Start Training
1. Navigate to `/training` page
2. Enter session name (e.g., "Navigate to Coordinate")
3. Select initial game state
4. Click "Start Recording"
5. System captures initial screenshot

### Step 2: Record Navigation
While recording, you can:
- **Use Quick Actions**: Pre-defined buttons for common actions
- **Execute ADB Commands**: Actions are executed in real-time
- **View Recorded Actions**: See all actions you've performed

### Step 3: Complete Training
1. Click "Save as Pattern" when done
2. Enter pattern name and description
3. System creates reusable pattern

## Training Interface

### Quick Actions
- **Tap Center**: Tap at screen center (960, 540)
- **Swipe Up**: Swipe upward gesture
- **Back Button**: Press Android back button

### Custom Actions
You can also execute custom ADB commands:
- Tap at specific coordinates
- Swipe gestures
- Key events
- Text input

## Pattern Types

### Screen Match Pattern
- Matches screenshots based on visual similarity
- Uses template screenshot for comparison
- Executes recorded actions when match found

### Coordinate Navigation Pattern
- Navigates to specific coordinates
- Uses in-game coordinate search
- Combines with screen matching

### Hybrid Pattern
- Combines screen matching + coordinate navigation
- Most flexible pattern type

## Database Schema

### navigation_patterns
Stores learned patterns:
- Template screenshot reference
- Match criteria (threshold, features)
- Action sequence to execute
- Success/failure statistics

### navigation_training_sessions
Records training sessions:
- Initial and final screenshots
- All recorded actions
- Session metadata

### pattern_executions
Tracks pattern usage:
- When patterns were matched
- Execution results
- User verification

## API Endpoints

### POST `/api/training/start`
Start a new training session.

**Request:**
```json
{
  "session_name": "Navigate to Coordinate",
  "device_id": "127.0.0.1:5555",
  "initial_game_state": "map"
}
```

**Response:**
```json
{
  "success": true,
  "training_session": {
    "id": "uuid",
    "screenshot_id": "uuid",
    "screenshot_url": "https://...",
    "started_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST `/api/training/record-action`
Record an action during training.

**Request:**
```json
{
  "training_session_id": "uuid",
  "action": {
    "type": "tap",
    "x": 960,
    "y": 540,
    "description": "Tap center"
  }
}
```

### POST `/api/training/complete`
Complete training session and optionally create pattern.

**Request:**
```json
{
  "training_session_id": "uuid",
  "pattern_name": "Navigate to Coordinate",
  "pattern_description": "Navigates to a coordinate on the map",
  "create_pattern": true,
  "final_screenshot_id": "uuid",
  "final_game_state": "map",
  "success": true
}
```

## Pattern Matching

### How Patterns Are Matched

1. **Screenshot Comparison**: Compare current screenshot with template
2. **Feature Extraction**: Extract UI elements, text, buttons
3. **Confidence Scoring**: Calculate match confidence (0.0 to 1.0)
4. **Threshold Check**: If confidence > threshold, execute actions

### Match Features
- Visual similarity (image comparison)
- OCR text extraction
- UI element detection
- Game state indicators

## Best Practices

### Training Tips

1. **Clear Screenshots**: Start with clear, uncluttered screens
2. **Consistent Actions**: Use same actions for similar situations
3. **Multiple Examples**: Train same pattern multiple times for better accuracy
4. **Descriptive Names**: Use clear pattern names
5. **Test Patterns**: Verify patterns work before relying on them

### Pattern Naming
- Use descriptive names: "Navigate to Coordinate", "Open Scout Menu"
- Include context: "Map → Search → Coordinate"
- Version patterns: "Navigate v1", "Navigate v2"

### Action Recording
- Record all necessary actions
- Include wait times for loading
- Test actions during training
- Verify final state matches expected

## Example Training Scenarios

### Scenario 1: Navigate to Coordinate
1. Start training from map screen
2. Tap search button
3. Enter X coordinate
4. Enter Y coordinate
5. Confirm search
6. Save as "Navigate to Coordinate" pattern

### Scenario 2: Scout Target
1. Start training from map with target visible
2. Tap on target
3. Tap scout button
4. Wait for scout report
5. Save as "Scout Target" pattern

### Scenario 3: Pan Map
1. Start training from map
2. Swipe to pan map
3. Record swipe gesture
4. Save as "Pan Map" pattern

## Integration with Map

The training system integrates with the map interface:
- Train patterns from map coordinates
- Use patterns to navigate to coordinates
- Combine coordinate navigation with screen matching

## Future Enhancements

1. **Visual Pattern Builder**: Drag-and-drop interface
2. **Pattern Library**: Browse and share patterns
3. **Auto-Training**: System learns from user actions automatically
4. **Pattern Versioning**: Track pattern improvements
5. **Confidence Learning**: System improves confidence scores over time
6. **Multi-Device Training**: Train patterns for different screen sizes

## Troubleshooting

### Pattern Not Matching
- Lower match threshold
- Retrain with clearer screenshot
- Check if game UI changed
- Verify template screenshot is current

### Actions Not Executing
- Check ADB connection
- Verify device ID
- Test actions manually
- Check action coordinates

### Training Session Fails
- Verify ADB device connected
- Check warbot backend running
- Verify screenshot capture works
- Check database permissions

