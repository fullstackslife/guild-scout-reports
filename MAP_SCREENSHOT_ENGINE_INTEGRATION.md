# Map Screenshot Engine Integration

## Overview
The map component has been enhanced to serve as an entry point for the screenshot engine, integrating with the warbot ADB system to capture screenshots from BlueStacks and create game states based on screenshots.

## New Features

### 1. Game State Tracking
- **Database Schema**: Added `game_state` field to screenshots table
- **Game States Supported**: 
  - `scout` - Scout report screens
  - `battle` - Battle screens
  - `menu` - Menu screens
  - `map` - Map view screens
  - `loading` - Loading screens
  - `unknown` - Unknown/undetected states

### 2. Screenshot Capture Integration
- **ADB Integration**: Direct connection to warbot ADB system
- **Coordinate-Based Capture**: Capture screenshots at specific map coordinates
- **Device Management**: Support for multiple ADB devices
- **Capture Methods**: 
  - `manual` - User-initiated captures
  - `adb` - Automated via ADB
  - `scheduled` - Scheduled captures
  - `automated` - Fully automated captures

### 3. Map UI Enhancements
- **Screenshot Capture Panel**: Appears when a coordinate is selected
- **Game State Selection**: Dropdown to specify expected game state
- **Device ID Input**: Configure which ADB device to use
- **Capture Status**: Real-time feedback during capture
- **Last Capture Display**: Shows link to most recent capture

### 4. Database Tables

#### `screenshots` (Enhanced)
- `game_state` - Current game state detected
- `coordinate_k`, `coordinate_x`, `coordinate_y` - Map coordinates
- `capture_method` - How screenshot was captured
- `capture_source` - Source system (warbot, web, etc.)
- `device_id` - ADB device identifier
- `scheduled_at` - For scheduled captures
- `metadata` - Additional game state data (JSONB)

#### `screenshot_schedules` (New)
- Schedule automated screenshot captures
- Support for one-time, recurring, and interval-based schedules
- Coordinate-based filtering
- Game state filtering
- Capture limits and auto-processing

#### `coordinate_game_states` (New)
- Historical game state tracking per coordinate
- Links to screenshots
- Extracted data snapshots
- Metadata storage

## API Endpoints

### POST `/api/screenshots/capture`
Captures a screenshot via ADB and stores it with game state metadata.

**Request Body:**
```json
{
  "coordinate_k": "123",
  "coordinate_x": "500",
  "coordinate_y": "500",
  "game_state": "scout",
  "device_id": "127.0.0.1:5555",
  "label": "Optional label"
}
```

**Response:**
```json
{
  "success": true,
  "screenshot": {
    "id": "uuid",
    "url": "https://...",
    "game_state": "scout",
    "coordinates": {
      "k": "123",
      "x": "500",
      "y": "500"
    }
  }
}
```

## Usage

### Capturing Screenshots from Map

1. **Select a Coordinate**: Click on the map to select a coordinate
2. **Select Kingdom**: Choose the kingdom from the dropdown
3. **Open Capture Panel**: Click "Show Capture Panel"
4. **Configure Settings**:
   - Select game state (scout, battle, menu, etc.)
   - Enter device ID (default: 127.0.0.1:5555)
5. **Capture**: Click "📸 Capture Screenshot via ADB"
6. **View Result**: Link to captured screenshot appears

### Environment Variables

Add to `.env.local`:
```env
WARBOT_API_URL=http://localhost:8000
WARBOT_API_KEY=your_api_key_here
```

## Integration with Warbot

The system integrates with the warbot backend located at:
- `C:\Users\Brian\OneDrive - Fullstacks.us\Desktop\warbot\backend`

The warbot system provides:
- ADB device management
- Screenshot capture via `adb_utils.py`
- Game state detection via `automation_controller.py`
- State cataloging and learning

## Future Enhancements

1. **Scheduled Captures**: UI for creating screenshot schedules
2. **Game State Visualization**: Different markers on map for different states
3. **State History**: Timeline view of game states per coordinate
4. **Automated Processing**: Auto-process OCR after capture
5. **Batch Operations**: Capture multiple coordinates at once
6. **State Detection AI**: Automatic game state detection from screenshots

## Database Migration

Run the migration to add new tables and fields:
```bash
# Migration file: supabase/migrations/0014_add_game_state_tracking.sql
```

This migration:
- Adds game state fields to screenshots
- Creates screenshot_schedules table
- Creates coordinate_game_states table
- Sets up proper indexes and RLS policies

## Notes

- The capture API requires the warbot backend to be running
- ADB devices must be connected and accessible
- Screenshots are stored in Supabase Storage
- Game state history is automatically tracked
- All captures are linked to coordinates for map visualization

