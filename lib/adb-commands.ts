/**
 * ADB Command Templates and Sequences
 * Pre-defined commands for Lords Mobile navigation
 */

export interface ADBCommand {
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
  description?: string;
}

/**
 * Common ADB Key Codes
 */
export const KEY_CODES = {
  HOME: 3,
  BACK: 4,
  MENU: 82,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  ENTER: 66,
  DELETE: 67,
} as const;

/**
 * Lords Mobile Navigation Commands
 * Screen coordinates are typically 1920x1080 for BlueStacks
 */
export const LORDS_MOBILE_COMMANDS = {
  // Navigation
  goToMap: (): ADBCommand[] => [
    { type: 'tap', x: 100, y: 100, description: 'Open map' },
    { type: 'wait', duration: 1000 }
  ],
  
  goToCastle: (): ADBCommand[] => [
    { type: 'tap', x: 100, y: 200, description: 'Return to castle' },
    { type: 'wait', duration: 1000 }
  ],
  
  goToScout: (): ADBCommand[] => [
    { type: 'tap', x: 1800, y: 200, description: 'Open scout menu' },
    { type: 'wait', duration: 500 }
  ],
  
  // Map Navigation
  searchCoordinate: (x: number, y: number): ADBCommand[] => [
    { type: 'tap', x: 1700, y: 100, description: 'Open search' },
    { type: 'wait', duration: 500 },
    { type: 'tap', x: 960, y: 300, description: 'Click X coordinate' },
    { type: 'text', text: x.toString() },
    { type: 'wait', duration: 300 },
    { type: 'tap', x: 960, y: 400, description: 'Click Y coordinate' },
    { type: 'text', text: y.toString() },
    { type: 'wait', duration: 300 },
    { type: 'tap', x: 960, y: 600, description: 'Confirm search' },
    { type: 'wait', duration: 1500 }
  ],
  
  scoutTarget: (): ADBCommand[] => [
    { type: 'tap', x: 1600, y: 800, description: 'Tap scout button' },
    { type: 'wait', duration: 2000 }
  ],
  
  // Map Movement
  panMap: (direction: 'up' | 'down' | 'left' | 'right', distance: number = 300): ADBCommand[] => {
    const centerX = 960;
    const centerY = 540;
    let x1 = centerX, y1 = centerY, x2 = centerX, y2 = centerY;
    
    switch (direction) {
      case 'up':
        y1 = centerY + distance;
        y2 = centerY - distance;
        break;
      case 'down':
        y1 = centerY - distance;
        y2 = centerY + distance;
        break;
      case 'left':
        x1 = centerX + distance;
        x2 = centerX - distance;
        break;
      case 'right':
        x1 = centerX - distance;
        x2 = centerX + distance;
        break;
    }
    
    return [
      {
        type: 'swipe',
        x1,
        y1,
        x2,
        y2,
        duration: 300,
        description: `Pan map ${direction}`
      },
      { type: 'wait', duration: 500 }
    ];
  },
  
  zoomMap: (direction: 'in' | 'out'): ADBCommand[] => {
    const centerX = 960;
    const centerY = 540;
    
    if (direction === 'in') {
      return [
        {
          type: 'swipe',
          x1: centerX - 200,
          y1: centerY - 200,
          x2: centerX + 200,
          y2: centerY + 200,
          duration: 300,
          description: 'Zoom in'
        },
        { type: 'wait', duration: 500 }
      ];
    } else {
      return [
        {
          type: 'swipe',
          x1: centerX + 200,
          y1: centerY + 200,
          x2: centerX - 200,
          y2: centerY - 200,
          duration: 300,
          description: 'Zoom out'
        },
        { type: 'wait', duration: 500 }
      ];
    }
  },
  
  // Scout Report Navigation
  viewScoutReport: (): ADBCommand[] => [
    { type: 'tap', x: 1600, y: 800, description: 'View scout report' },
    { type: 'wait', duration: 2000 }
  ],
  
  closeScoutReport: (): ADBCommand[] => [
    { type: 'tap', x: 1800, y: 100, description: 'Close scout report' },
    { type: 'wait', duration: 500 }
  ],
  
  // Utility
  wait: (ms: number): ADBCommand => ({
    type: 'wait',
    duration: ms
  }),
  
  tap: (x: number, y: number, delay: number = 500): ADBCommand[] => [
    { type: 'tap', x, y },
    { type: 'wait', duration: delay }
  ],
  
  swipe: (x1: number, y1: number, x2: number, y2: number, duration: number = 300): ADBCommand[] => [
    { type: 'swipe', x1, y1, x2, y2, duration },
    { type: 'wait', duration: 500 }
  ],
  
  pressKey: (keycode: number): ADBCommand[] => [
    { type: 'key', keycode },
    { type: 'wait', duration: 300 }
  ],
  
  // Complex Sequences
  navigateToCoordinateAndScout: (x: number, y: number): ADBCommand[] => [
    ...LORDS_MOBILE_COMMANDS.goToMap(),
    ...LORDS_MOBILE_COMMANDS.searchCoordinate(x, y),
    ...LORDS_MOBILE_COMMANDS.scoutTarget(),
    ...LORDS_MOBILE_COMMANDS.viewScoutReport(),
    { type: 'wait', duration: 3000 }
  ],
  
  captureScoutReport: (x: number, y: number): ADBCommand[] => [
    ...LORDS_MOBILE_COMMANDS.navigateToCoordinateAndScout(x, y),
    // Screenshot would be captured separately via screenshot API
    ...LORDS_MOBILE_COMMANDS.closeScoutReport()
  ]
};

/**
 * Create a custom command sequence
 */
export function createSequence(commands: ADBCommand[]): ADBCommand {
  return {
    type: 'sequence',
    commands,
    description: `Custom sequence with ${commands.length} commands`
  };
}

/**
 * Build command with delays
 */
export function withDelays(commands: ADBCommand[], delayMs: number = 500): ADBCommand[] {
  return commands.map((cmd, index) => ({
    ...cmd,
    delay: index < commands.length - 1 ? delayMs : undefined
  }));
}

