# ADB Navigation Setup Guide

## Overview
This system provides ADB command articulation and manipulation to properly navigate Lords Mobile through BlueStacks. It integrates with the warbot backend to execute commands and sequences.

## Architecture

### Components

1. **Frontend (Map UI)**
   - Navigation panel with pre-defined actions
   - Custom command execution
   - Real-time status feedback

2. **API Layer (`/api/adb/navigate`)**
   - Receives navigation commands
   - Executes command sequences
   - Returns execution results

3. **Warbot Backend Integration**
   - ADB command execution
   - Device management
   - Command sequence processing

4. **Command Library (`lib/adb-commands.ts`)**
   - Pre-defined command templates
   - Lords Mobile navigation sequences
   - Reusable command builders

## Setup

### 1. Environment Variables

Add to `.env.local`:
```env
WARBOT_API_URL=http://localhost:8000
WARBOT_API_KEY=your_api_key_here
```

### 2. Warbot Backend Endpoint

The warbot backend needs to expose an endpoint at `/api/adb/execute`:

```python
# backend/app/main.py or similar
@app.post("/api/adb/execute")
async def execute_adb_command(request: Request):
    data = await request.json()
    device_id = data.get("device_id", "127.0.0.1:5555")
    command = data.get("command")
    
    from adb_utils import tap, swipe, press_key, input_text
    
    try:
        if command["type"] == "tap":
            result = tap(command["x"], command["y"], device_id)
            return {"success": True, "result": result.stdout}
        elif command["type"] == "swipe":
            result = swipe(
                command["x1"], command["y1"],
                command["x2"], command["y2"],
                command.get("duration", 300),
                device_id
            )
            return {"success": True, "result": result.stdout}
        elif command["type"] == "key":
            result = press_key(command["keycode"], device_id)
            return {"success": True, "result": result.stdout}
        elif command["type"] == "text":
            result = input_text(command["text"], device_id)
            return {"success": True, "result": result.stdout}
        elif command["type"] == "wait":
            import asyncio
            await asyncio.sleep(command.get("duration", 1000) / 1000)
            return {"success": True, "result": "waited"}
        else:
            return {"success": False, "error": "Unknown command type"}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

### 3. ADB Device Connection

Ensure BlueStacks is running and ADB is connected:

```bash
# Connect to BlueStacks (default port)
adb connect 127.0.0.1:5555

# Verify connection
adb devices
```

## Usage

### From Map Interface

1. **Select a Coordinate**: Click on the map to select coordinates
2. **Open Navigation Panel**: Click "Show Navigation Panel"
3. **Choose Action**:
   - **Search Coordinate**: Navigates to the coordinate on the map
   - **Navigate & Scout**: Navigates to coordinate and initiates scout
   - **Quick Actions**: Pre-defined navigation commands

### Command Types

#### Tap
```typescript
{
  type: 'tap',
  x: 960,
  y: 540,
  description: 'Tap center of screen'
}
```

#### Swipe
```typescript
{
  type: 'swipe',
  x1: 960,
  y1: 540,
  x2: 960,
  y2: 240,
  duration: 300,
  description: 'Swipe up'
}
```

#### Key Event
```typescript
{
  type: 'key',
  keycode: 4, // BACK button
  description: 'Press back'
}
```

#### Text Input
```typescript
{
  type: 'text',
  text: '500',
  description: 'Input coordinate'
}
```

#### Wait
```typescript
{
  type: 'wait',
  duration: 1000, // milliseconds
  description: 'Wait 1 second'
}
```

### Command Sequences

Execute multiple commands in order:

```typescript
const sequence = [
  { type: 'tap', x: 100, y: 100 },
  { type: 'wait', duration: 1000 },
  { type: 'tap', x: 960, y: 540 },
  { type: 'wait', duration: 500 }
];
```

## Pre-defined Commands

### Lords Mobile Navigation

Located in `lib/adb-commands.ts`:

- `goToMap()` - Navigate to map view
- `goToCastle()` - Return to castle
- `goToScout()` - Open scout menu
- `searchCoordinate(x, y)` - Search for coordinate
- `scoutTarget()` - Scout current target
- `panMap(direction, distance)` - Pan map
- `zoomMap(direction)` - Zoom in/out
- `navigateToCoordinateAndScout(x, y)` - Full navigation sequence

### Example Usage

```typescript
import { LORDS_MOBILE_COMMANDS } from '@/lib/adb-commands';

// Navigate to coordinate and scout
const sequence = LORDS_MOBILE_COMMANDS.navigateToCoordinateAndScout(500, 500);

// Execute via API
await fetch('/api/adb/navigate', {
  method: 'POST',
  body: JSON.stringify({
    device_id: '127.0.0.1:5555',
    sequence
  })
});
```

## Screen Coordinates

Default BlueStacks resolution: **1920x1080**

Common coordinate reference:
- **Top-left**: (0, 0)
- **Center**: (960, 540)
- **Top-right**: (1920, 0)
- **Bottom-left**: (0, 1080)
- **Bottom-right**: (1920, 1080)

### Lords Mobile UI Elements (1920x1080)

- **Map Button**: (100, 100)
- **Castle Button**: (100, 200)
- **Scout Menu**: (1800, 200)
- **Search Button**: (1700, 100)
- **Scout Button**: (1600, 800)
- **Close Button**: (1800, 100)

*Note: Coordinates may vary based on screen resolution and UI updates*

## Advanced Usage

### Custom Command Sequences

Create complex navigation flows:

```typescript
const customSequence = [
  ...LORDS_MOBILE_COMMANDS.goToMap(),
  ...LORDS_MOBILE_COMMANDS.searchCoordinate(500, 500),
  ...LORDS_MOBILE_COMMANDS.scoutTarget(),
  { type: 'wait', duration: 3000 },
  ...LORDS_MOBILE_COMMANDS.closeScoutReport()
];
```

### Error Handling

The API returns success/failure status:

```typescript
const response = await fetch('/api/adb/navigate', { ... });
const data = await response.json();

if (data.success) {
  console.log(`Executed ${data.executed} commands`);
} else {
  console.error(`Error: ${data.error}`);
}
```

## Troubleshooting

### ADB Not Connected
- Ensure BlueStacks is running
- Check ADB connection: `adb devices`
- Verify device ID matches (default: 127.0.0.1:5555)

### Commands Not Executing
- Check warbot backend is running
- Verify `WARBOT_API_URL` environment variable
- Check backend logs for errors

### Wrong Coordinates
- Verify screen resolution matches expected (1920x1080)
- Use screenshot to identify correct coordinates
- Adjust coordinates based on your setup

## Security

- ADB commands are executed server-side only
- Device ID validation prevents unauthorized access
- User authentication required for all API calls
- Command sequences are validated before execution

## Future Enhancements

1. **Coordinate Calibration**: UI to calibrate coordinates
2. **Command Recording**: Record and replay user actions
3. **Visual Command Builder**: Drag-and-drop command sequence builder
4. **Template Library**: Save and share command sequences
5. **Error Recovery**: Automatic retry with adjusted coordinates
6. **State Detection**: Verify game state before/after commands

