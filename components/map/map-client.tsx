"use client";

import { useMemo, useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Database } from '@/lib/supabase/database.types';

type ScoutReportRow = Database['public']['Tables']['scout_reports']['Row'];

interface MapClientProps {
  reports: ScoutReportRow[];
  kingdoms: string[];
  selectedKingdom: string | null;
}

interface CoordinateData {
  x: number;
  y: number;
  count: number;
  reports: Array<{
    target_name: string | null;
    target_guild: string | null;
    might: number | null;
    created_at: string;
  }>;
}

export function MapClient({ reports, kingdoms, selectedKingdom }: MapClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; count: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  
  // Advanced search filters
  const [minMight, setMinMight] = useState<string>('');
  const [maxMight, setMaxMight] = useState<string>('');
  const [minActivityHours, setMinActivityHours] = useState<string>('');
  const [searchNearX, setSearchNearX] = useState<string>('');
  const [searchNearY, setSearchNearY] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<string>('50');
  const [showFilters, setShowFilters] = useState(false);
  
  // Screenshot capture state
  const [capturing, setCapturing] = useState(false);
  const [captureGameState, setCaptureGameState] = useState<string>('scout');
  const [deviceId, setDeviceId] = useState<string>('127.0.0.1:5555');
  const [showCapturePanel, setShowCapturePanel] = useState(false);
  const [lastCapture, setLastCapture] = useState<{ url: string; timestamp: string } | null>(null);
  
  // ADB Navigation state
  const [navigating, setNavigating] = useState(false);
  const [showNavigationPanel, setShowNavigationPanel] = useState(false);
  const [lastNavigation, setLastNavigation] = useState<{ success: boolean; message: string } | null>(null);

  // Filter reports based on search criteria
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    // Filter by might range
    if (minMight) {
      const min = parseInt(minMight);
      if (!isNaN(min)) {
        filtered = filtered.filter((r) => r.might !== null && r.might >= min);
      }
    }
    if (maxMight) {
      const max = parseInt(maxMight);
      if (!isNaN(max)) {
        filtered = filtered.filter((r) => r.might !== null && r.might <= max);
      }
    }

    // Filter by activity time (hours since last report)
    if (minActivityHours) {
      const hours = parseInt(minActivityHours);
      if (!isNaN(hours)) {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - hours);
        filtered = filtered.filter((r) => new Date(r.created_at) >= cutoffTime);
      }
    }

    // Filter by proximity to coordinates
    if (searchNearX && searchNearY) {
      const centerX = parseInt(searchNearX);
      const centerY = parseInt(searchNearY);
      const radius = parseInt(searchRadius) || 50;
      
      if (!isNaN(centerX) && !isNaN(centerY) && !isNaN(radius)) {
        filtered = filtered.filter((r) => {
          const x = r.coordinate_x ? parseInt(r.coordinate_x) : null;
          const y = r.coordinate_y ? parseInt(r.coordinate_y) : null;
          if (x === null || y === null || isNaN(x) || isNaN(y)) return false;
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          return distance <= radius;
        });
      }
    }

    return filtered;
  }, [reports, minMight, maxMight, minActivityHours, searchNearX, searchNearY, searchRadius]);

  // Process filtered reports into coordinate map
  const coordinateMap = useMemo(() => {
    const map = new Map<string, CoordinateData>();

    filteredReports.forEach((report) => {
      const x = report.coordinate_x ? parseInt(report.coordinate_x) : null;
      const y = report.coordinate_y ? parseInt(report.coordinate_y) : null;

      if (x === null || y === null || isNaN(x) || isNaN(y)) {
        return;
      }

      const key = `${x}:${y}`;
      const existing = map.get(key);

      if (existing) {
        existing.count++;
        existing.reports.push({
          target_name: report.target_name,
          target_guild: report.target_guild,
          might: report.might,
          created_at: report.created_at
        });
      } else {
        map.set(key, {
          x,
          y,
          count: 1,
          reports: [
            {
              target_name: report.target_name,
              target_guild: report.target_guild,
              might: report.might,
              created_at: report.created_at
            }
          ]
        });
      }
    });

    return map;
  }, [filteredReports]);

  // Calculate map bounds - Lords Mobile uses 0-1000 coordinate system
  const bounds = useMemo(() => {
    if (coordinateMap.size === 0) {
      return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    coordinateMap.forEach((data) => {
      minX = Math.min(minX, data.x);
      maxX = Math.max(maxX, data.x);
      minY = Math.min(minY, data.y);
      maxY = Math.max(maxY, data.y);
    });

    // Add padding but keep within 0-1000 range
    const padding = 50;
    return {
      minX: Math.max(0, minX - padding),
      maxX: Math.min(1000, maxX + padding),
      minY: Math.max(0, minY - padding),
      maxY: Math.min(1000, maxY + padding)
    };
  }, [coordinateMap]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalReports = filteredReports.length;
    const uniqueCoordinates = coordinateMap.size;
    const maxCount = Math.max(...Array.from(coordinateMap.values()).map((d) => d.count), 0);
    const avgCount = coordinateMap.size > 0 ? totalReports / coordinateMap.size : 0;

    // Calculate might statistics
    const mights = filteredReports
      .map((r) => r.might)
      .filter((m): m is number => m !== null && m > 0);
    const avgMight = mights.length > 0 ? mights.reduce((a, b) => a + b, 0) / mights.length : 0;
    const maxMight = mights.length > 0 ? Math.max(...mights) : 0;
    const minMight = mights.length > 0 ? Math.min(...mights) : 0;

    // Calculate activity statistics (time since last report)
    const now = new Date();
    const activityTimes = filteredReports.map((r) => {
      const reportTime = new Date(r.created_at);
      return (now.getTime() - reportTime.getTime()) / (1000 * 60 * 60); // hours
    });
    const avgActivityHours = activityTimes.length > 0 
      ? activityTimes.reduce((a, b) => a + b, 0) / activityTimes.length 
      : 0;
    const oldestReportHours = activityTimes.length > 0 ? Math.max(...activityTimes) : 0;

    // Group by target name for player activity
    const playerActivity = new Map<string, number>();
    filteredReports.forEach((r) => {
      if (r.target_name) {
        playerActivity.set(r.target_name, (playerActivity.get(r.target_name) || 0) + 1);
      }
    });

    // Group by guild for guild activity
    const guildActivity = new Map<string, number>();
    filteredReports.forEach((r) => {
      if (r.target_guild) {
        guildActivity.set(r.target_guild, (guildActivity.get(r.target_guild) || 0) + 1);
      }
    });

    return {
      totalReports,
      uniqueCoordinates,
      maxCount,
      avgCount: Math.round(avgCount * 100) / 100,
      avgMight: Math.round(avgMight),
      maxMight,
      minMight,
      avgActivityHours: Math.round(avgActivityHours * 10) / 10,
      oldestReportHours: Math.round(oldestReportHours * 10) / 10,
      uniquePlayers: playerActivity.size,
      uniqueGuilds: guildActivity.size,
      topPlayers: Array.from(playerActivity.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      topGuilds: Array.from(guildActivity.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }, [filteredReports, coordinateMap]);

  // Draw heatmap with game-like styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellSize = 5; // Size of each cell in pixels

    // Clear canvas with terrain-like background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a2e1a');
    gradient.addColorStop(0.5, '#2d4a2d');
    gradient.addColorStop(1, '#1a2e1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (coordinateMap.size === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No scout reports with coordinates found', width / 2, height / 2);
      return;
    }

    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const scaleX = width / rangeX;
    const scaleY = height / rangeY;

    // Draw grid lines (every 100 coordinates for reference)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    const gridStep = 100;
    const startGridX = Math.floor(bounds.minX / gridStep) * gridStep;
    const startGridY = Math.floor(bounds.minY / gridStep) * gridStep;
    
    for (let x = startGridX; x <= bounds.maxX; x += gridStep) {
      const screenX = ((x - bounds.minX) * scaleX);
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }
    
    for (let y = startGridY; y <= bounds.maxY; y += gridStep) {
      const screenY = ((y - bounds.minY) * scaleY);
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }

    // Find max count for color scaling
    const maxCount = stats.maxCount;

    // Draw cells with game-like appearance
    coordinateMap.forEach((data) => {
      const screenX = ((data.x - bounds.minX) * scaleX) - cellSize / 2;
      const screenY = ((data.y - bounds.minY) * scaleY) - cellSize / 2;

      // Calculate color intensity (0-1)
      const intensity = Math.min(1, data.count / maxCount);

      // Color gradient: dark blue -> light blue -> yellow -> red (matching game heatmap style)
      let r, g, b;
      if (intensity < 0.25) {
        // Dark blue to light blue
        const t = intensity / 0.25;
        r = Math.round(30 + t * 30);
        g = Math.round(60 + t * 100);
        b = Math.round(100 + t * 155);
      } else if (intensity < 0.5) {
        // Light blue to cyan
        const t = (intensity - 0.25) / 0.25;
        r = Math.round(60 + t * 40);
        g = Math.round(160 + t * 95);
        b = Math.round(255);
      } else if (intensity < 0.75) {
        // Cyan to yellow
        const t = (intensity - 0.5) / 0.25;
        r = Math.round(100 + t * 155);
        g = Math.round(255);
        b = Math.round(255 - t * 255);
      } else {
        // Yellow to red
        const t = (intensity - 0.75) / 0.25;
        r = Math.round(255);
        g = Math.round(255 - t * 255);
        b = 0;
      }

      // Draw with slight glow effect for better visibility
      ctx.shadowBlur = 3;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(screenX, screenY, cellSize, cellSize);
      ctx.shadowBlur = 0;

      // Highlight selected cell
      if (selectedCell && selectedCell.x === data.x && selectedCell.y === data.y) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.strokeRect(screenX - 2, screenY - 2, cellSize + 4, cellSize + 4);
        ctx.shadowBlur = 0;
      }
    });

    // Draw coordinate labels on grid intersections
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let x = startGridX; x <= bounds.maxX; x += gridStep) {
      const screenX = ((x - bounds.minX) * scaleX);
      ctx.fillText(x.toString(), screenX, 15);
    }
    
    ctx.textAlign = 'left';
    for (let y = startGridY; y <= bounds.maxY; y += gridStep) {
      const screenY = ((y - bounds.minY) * scaleY);
      ctx.fillText(y.toString(), 5, screenY);
    }

    // Draw hover effect
    if (hoveredCell) {
      const screenX = ((hoveredCell.x - bounds.minX) * scaleX) - cellSize / 2;
      const screenY = ((hoveredCell.y - bounds.minY) * scaleY) - cellSize / 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeRect(screenX - 2, screenY - 2, cellSize + 4, cellSize + 4);
      ctx.shadowBlur = 0;
      
      // Draw coordinate text near hover
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const coordText = `${hoveredCell.x}:${hoveredCell.y}`;
      const textMetrics = ctx.measureText(coordText);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(screenX + cellSize + 5, screenY - 2, textMetrics.width + 8, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(coordText, screenX + cellSize + 9, screenY);
    }
  }, [coordinateMap, bounds, stats.maxCount, hoveredCell, selectedCell]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const scaleX = canvas.width / rangeX;
    const scaleY = canvas.height / rangeY;

    const mapX = Math.round(bounds.minX + x / scaleX);
    const mapY = Math.round(bounds.minY + y / scaleY);

    // Find closest coordinate
    const coordinates = Array.from(coordinateMap.values());
    let closest: { x: number; y: number; distance: number } | null = null;
    
    for (const data of coordinates) {
      const distance = Math.sqrt(Math.pow(data.x - mapX, 2) + Math.pow(data.y - mapY, 2));
      if (closest === null || distance < closest.distance) {
        closest = { x: data.x, y: data.y, distance };
      }
    }

    if (closest !== null && closest.distance < 50) {
      setSelectedCell({ x: closest.x, y: closest.y });
    } else {
      setSelectedCell(null);
    }
  };

  // Handle canvas mouse move
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rangeX = bounds.maxX - bounds.minX;
    const rangeY = bounds.maxY - bounds.minY;
    const scaleX = canvas.width / rangeX;
    const scaleY = canvas.height / rangeY;

    const mapX = Math.round(bounds.minX + x / scaleX);
    const mapY = Math.round(bounds.minY + y / scaleY);

    // Find closest coordinate
    const coordinates = Array.from(coordinateMap.values());
    let closest: { x: number; y: number; count: number; distance: number } | null = null;
    
    for (const data of coordinates) {
      const distance = Math.sqrt(Math.pow(data.x - mapX, 2) + Math.pow(data.y - mapY, 2));
      if (closest === null || distance < closest.distance) {
        closest = { x: data.x, y: data.y, count: data.count, distance };
      }
    }

    if (closest !== null && closest.distance < 50) {
      setHoveredCell({ x: closest.x, y: closest.y, count: closest.count });
    } else {
      setHoveredCell(null);
    }
  };

  const handleKingdomChange = (kingdom: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (kingdom) {
      params.set('kingdom', kingdom);
    } else {
      params.delete('kingdom');
    }
    router.push(`/map?${params.toString()}`);
  };

  // Handle ADB navigation
  const handleNavigate = async (commandType: 'search' | 'scout' | 'custom', customCommands?: any[]) => {
    if (!selectedCell || !selectedKingdom) {
      alert('Please select a coordinate and kingdom first');
      return;
    }

    setNavigating(true);
    try {
      let sequence: any[] = [];
      
      if (commandType === 'search') {
        // Navigate to coordinate on map
        sequence = [
          { type: 'tap', x: 100, y: 100, description: 'Open map' },
          { type: 'wait', duration: 1000 },
          { type: 'tap', x: 1700, y: 100, description: 'Open search' },
          { type: 'wait', duration: 500 },
          { type: 'tap', x: 960, y: 300, description: 'Click X coordinate' },
          { type: 'text', text: selectedCell.x.toString() },
          { type: 'wait', duration: 300 },
          { type: 'tap', x: 960, y: 400, description: 'Click Y coordinate' },
          { type: 'text', text: selectedCell.y.toString() },
          { type: 'wait', duration: 300 },
          { type: 'tap', x: 960, y: 600, description: 'Confirm search' },
          { type: 'wait', duration: 1500 }
        ];
      } else if (commandType === 'scout') {
        // Navigate to coordinate and scout
        sequence = [
          { type: 'tap', x: 100, y: 100, description: 'Open map' },
          { type: 'wait', duration: 1000 },
          { type: 'tap', x: 1700, y: 100, description: 'Open search' },
          { type: 'wait', duration: 500 },
          { type: 'tap', x: 960, y: 300, description: 'Click X coordinate' },
          { type: 'text', text: selectedCell.x.toString() },
          { type: 'wait', duration: 300 },
          { type: 'tap', x: 960, y: 400, description: 'Click Y coordinate' },
          { type: 'text', text: selectedCell.y.toString() },
          { type: 'wait', duration: 300 },
          { type: 'tap', x: 960, y: 600, description: 'Confirm search' },
          { type: 'wait', duration: 1500 },
          { type: 'tap', x: 1600, y: 800, description: 'Tap scout button' },
          { type: 'wait', duration: 2000 },
          { type: 'tap', x: 1600, y: 800, description: 'View scout report' },
          { type: 'wait', duration: 2000 }
        ];
      } else if (commandType === 'custom' && customCommands) {
        sequence = customCommands;
      }

      const response = await fetch('/api/adb/navigate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_id: deviceId,
          sequence
        })
      });

      const data = await response.json();

      if (data.success) {
        setLastNavigation({
          success: true,
          message: `Navigation completed: ${data.executed} commands executed`
        });
      } else {
        setLastNavigation({
          success: false,
          message: `Navigation failed: ${data.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setLastNavigation({
        success: false,
        message: 'Failed to execute navigation commands'
      });
    } finally {
      setNavigating(false);
    }
  };

  // Handle screenshot capture
  const handleCaptureScreenshot = async () => {
    if (!selectedCell || !selectedKingdom) {
      alert('Please select a coordinate and kingdom first');
      return;
    }

    setCapturing(true);
    try {
      const response = await fetch('/api/screenshots/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinate_k: selectedKingdom,
          coordinate_x: selectedCell.x.toString(),
          coordinate_y: selectedCell.y.toString(),
          game_state: captureGameState,
          device_id: deviceId,
          label: `Map capture at ${selectedKingdom}:${selectedCell.x}:${selectedCell.y}`
        })
      });

      const data = await response.json();

      if (data.success) {
        setLastCapture({
          url: data.screenshot.url,
          timestamp: new Date().toISOString()
        });
        // Refresh the page to show new screenshot
        router.refresh();
      } else {
        alert(`Capture failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Capture error:', error);
      alert('Failed to capture screenshot');
    } finally {
      setCapturing(false);
    }
  };

  const selectedCellData = selectedCell
    ? coordinateMap.get(`${selectedCell.x}:${selectedCell.y}`)
    : null;

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Kingdom Map</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
          Visual heatmap of scout reports by coordinates (0-1000 range). Hover over cells to see details, click to view reports. Grid lines show every 100 coordinates.
        </p>
      </section>

      {/* Kingdom Filter and Advanced Search */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ color: '#cbd5f5', fontWeight: 500 }}>Kingdom:</label>
          <select
            value={selectedKingdom || ''}
            onChange={(e) => handleKingdomChange(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#0f172a',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            <option value="">All Kingdoms</option>
            {kingdoms.map((k) => (
              <option key={k} value={k}>
                Kingdom {k}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: showFilters ? '#1e40af' : '#0f172a',
              color: '#e2e8f0',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            {showFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>

        {/* Advanced Search Filters */}
        {showFilters && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              background: '#0f172a',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}
          >
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                Min Might
              </label>
              <input
                type="number"
                value={minMight}
                onChange={(e) => setMinMight(e.target.value)}
                placeholder="e.g. 1000000"
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
                Max Might
              </label>
              <input
                type="number"
                value={maxMight}
                onChange={(e) => setMaxMight(e.target.value)}
                placeholder="e.g. 5000000"
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
                Active Within (hours)
              </label>
              <input
                type="number"
                value={minActivityHours}
                onChange={(e) => setMinActivityHours(e.target.value)}
                placeholder="e.g. 24"
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
                Search Near X
              </label>
              <input
                type="number"
                value={searchNearX}
                onChange={(e) => setSearchNearX(e.target.value)}
                placeholder="X coordinate"
                min="0"
                max="1000"
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
                Search Near Y
              </label>
              <input
                type="number"
                value={searchNearY}
                onChange={(e) => setSearchNearY(e.target.value)}
                placeholder="Y coordinate"
                min="0"
                max="1000"
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
                Search Radius
              </label>
              <input
                type="number"
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                placeholder="Radius"
                min="1"
                max="500"
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
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setMinMight('');
                  setMaxMight('');
                  setMinActivityHours('');
                  setSearchNearX('');
                  setSearchNearY('');
                  setSearchRadius('50');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: '#7f1d1d',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {filteredReports.length !== reports.length && (
          <div style={{ color: '#38bdf8', fontSize: '0.9rem' }}>
            Showing {filteredReports.length} of {reports.length} reports (filtered)
          </div>
        )}
      </div>

      {/* Statistics Table */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#e2e8f0' }}>Statistics</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Reports</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>{stats.totalReports}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Unique Coordinates</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>{stats.uniqueCoordinates}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Max Reports per Coordinate</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>{stats.maxCount}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Avg Reports per Coordinate</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>{stats.avgCount}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Average Might</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.avgMight > 0 ? stats.avgMight.toLocaleString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Max Might</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.maxMight > 0 ? stats.maxMight.toLocaleString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Min Might</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.minMight > 0 ? stats.minMight.toLocaleString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Avg Activity (hours)</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.avgActivityHours > 0 ? `${stats.avgActivityHours}h` : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Oldest Report</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>
              {stats.oldestReportHours > 0 ? `${stats.oldestReportHours}h ago` : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Unique Players</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>{stats.uniquePlayers}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Unique Guilds</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 600 }}>{stats.uniqueGuilds}</div>
          </div>
        </div>
      </div>

      {/* Top Players and Guilds Activity */}
      {(stats.topPlayers.length > 0 || stats.topGuilds.length > 0) && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            background: '#111827',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {stats.topPlayers.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#e2e8f0' }}>Top Players by Activity</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {stats.topPlayers.map(([name, count], idx) => (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: idx < 3 ? 'rgba(56, 189, 248, 0.1)' : '#0f172a',
                      border: `1px solid ${idx < 3 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`
                    }}
                  >
                    <span style={{ color: '#e2e8f0' }}>{name}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{count} reports</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.topGuilds.length > 0 && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#e2e8f0' }}>Top Guilds by Activity</h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {stats.topGuilds.map(([guild, count], idx) => (
                  <div
                    key={guild}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      background: idx < 3 ? 'rgba(56, 189, 248, 0.1)' : '#0f172a',
                      border: `1px solid ${idx < 3 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`
                    }}
                  >
                    <span style={{ color: '#e2e8f0' }}>{guild}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{count} reports</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Heatmap */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          background: '#111827'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#e2e8f0' }}>Heatmap</h2>
          {hoveredCell && (
            <div style={{ color: '#38bdf8', fontSize: '0.9rem' }}>
              {hoveredCell.x}:{hoveredCell.y} - {hoveredCell.count} report{hoveredCell.count !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <canvas
            ref={canvasRef}
            width={1000}
            height={750}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredCell(null)}
            style={{
              width: '100%',
              maxWidth: '1000px',
              height: 'auto',
              border: '2px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '0.5rem',
              cursor: 'crosshair',
              background: '#1a2e1a',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
          />
          {/* Legend */}
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}
            >
              <span>Activity Level:</span>
              <span style={{ color: '#60a0ff' }}>Low</span>
              <div
                style={{
                  flex: 1,
                  height: '20px',
                  background: 'linear-gradient(to right, rgb(30, 60, 100), rgb(60, 160, 255), rgb(255, 255, 0), rgb(255, 0, 0))',
                  borderRadius: '0.25rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}
              />
              <span style={{ color: '#ff0000' }}>High</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
              Coordinates range: 0-1000 (Lords Mobile standard map size)
            </div>
          </div>
        </div>
      </div>

      {/* ADB Navigation Panel */}
      {selectedCell && selectedKingdom && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            background: 'rgba(34, 197, 94, 0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#22c55e' }}>
              ADB Navigation - {selectedKingdom}:{selectedCell.x}:{selectedCell.y}
            </h3>
            <button
              onClick={() => setShowNavigationPanel(!showNavigationPanel)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: showNavigationPanel ? '#15803d' : '#0f172a',
                color: '#e2e8f0',
                cursor: 'pointer'
              }}
            >
              {showNavigationPanel ? 'Hide' : 'Show'} Navigation Panel
            </button>
          </div>

          {showNavigationPanel && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <button
                  onClick={() => handleNavigate('search')}
                  disabled={navigating}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: navigating ? '#475569' : '#15803d',
                    color: '#e2e8f0',
                    cursor: navigating ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {navigating ? 'Navigating...' : '📍 Search Coordinate'}
                </button>
                <button
                  onClick={() => handleNavigate('scout')}
                  disabled={navigating}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    background: navigating ? '#475569' : '#15803d',
                    color: '#e2e8f0',
                    cursor: navigating ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {navigating ? 'Navigating...' : '🔍 Navigate & Scout'}
                </button>
              </div>
              
              <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Quick Actions:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleNavigate('custom', [{ type: 'tap', x: 100, y: 100 }, { type: 'wait', duration: 500 }])}
                    disabled={navigating}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      cursor: navigating ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Open Map
                  </button>
                  <button
                    onClick={() => handleNavigate('custom', [{ type: 'tap', x: 100, y: 200 }, { type: 'wait', duration: 500 }])}
                    disabled={navigating}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      cursor: navigating ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Return to Castle
                  </button>
                  <button
                    onClick={() => handleNavigate('custom', [{ type: 'key', keycode: 4 }, { type: 'wait', duration: 300 }])}
                    disabled={navigating}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      cursor: navigating ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Back Button
                  </button>
                </div>
              </div>
              
              {lastNavigation && (
                <div style={{ 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  background: lastNavigation.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${lastNavigation.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}>
                  <div style={{ color: lastNavigation.success ? '#22c55e' : '#ef4444', fontSize: '0.875rem' }}>
                    {lastNavigation.message}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screenshot Capture Panel */}
      {selectedCell && selectedKingdom && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            background: 'rgba(56, 189, 248, 0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8' }}>
              Screenshot Capture - {selectedKingdom}:{selectedCell.x}:{selectedCell.y}
            </h3>
            <button
              onClick={() => setShowCapturePanel(!showCapturePanel)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: showCapturePanel ? '#1e40af' : '#0f172a',
                color: '#e2e8f0',
                cursor: 'pointer'
              }}
            >
              {showCapturePanel ? 'Hide' : 'Show'} Capture Panel
            </button>
          </div>

          {showCapturePanel && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                    Game State
                  </label>
                  <select
                    value={captureGameState}
                    onChange={(e) => setCaptureGameState(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="scout">Scout Report</option>
                    <option value="battle">Battle</option>
                    <option value="menu">Menu</option>
                    <option value="map">Map View</option>
                    <option value="loading">Loading</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '0.875rem', display: 'block', marginBottom: '0.25rem' }}>
                    Device ID (ADB)
                  </label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="127.0.0.1:5555"
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
              <button
                onClick={handleCaptureScreenshot}
                disabled={capturing}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  background: capturing ? '#475569' : '#1e40af',
                  color: '#e2e8f0',
                  cursor: capturing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {capturing ? (
                  <>
                    <span>Capturing...</span>
                    <span style={{ fontSize: '0.875rem' }}>⏳</span>
                  </>
                ) : (
                  <>
                    <span>📸 Capture Screenshot via ADB</span>
                  </>
                )}
              </button>
              {lastCapture && (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <div style={{ color: '#38bdf8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Last Capture:</div>
                  <a
                    href={lastCapture.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#60a5fa', textDecoration: 'underline' }}
                  >
                    View Screenshot
                  </a>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {new Date(lastCapture.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Cell Details */}
      {selectedCellData && (
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            background: 'rgba(56, 189, 248, 0.1)'
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#38bdf8' }}>
            Coordinate {selectedCellData.x}:{selectedCellData.y} ({selectedCellData.count} report{selectedCellData.count !== 1 ? 's' : ''})
          </h3>
          <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
            {selectedCellData.reports.map((report, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: '#0f172a'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {report.target_name || 'Unknown'}
                    </div>
                    {report.target_guild && (
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{report.target_guild}</div>
                    )}
                  </div>
                  {report.might && (
                    <div style={{ color: '#38bdf8', fontWeight: 600 }}>{report.might.toLocaleString()}</div>
                  )}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  {new Date(report.created_at).toLocaleString()}
                  {' • '}
                  {Math.round((new Date().getTime() - new Date(report.created_at).getTime()) / (1000 * 60 * 60))}h ago
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

