/**
 * Script to import gear data from Excel file
 * This will be used to populate the gear_items table
 * 
 * Note: This requires the Excel file to be processed separately
 * For now, this is a placeholder structure
 */

import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

interface GearItem {
  name: string;
  category: string;
  subcategory?: string;
  tier?: number;
  base_value?: number;
  might_bonus?: number;
  stats?: Record<string, unknown>;
  rarity?: string;
  game?: string;
}

/**
 * Import gear items from parsed Excel data
 * The Excel file should be parsed separately and passed as an array
 */
export async function importGearItems(gearItems: GearItem[]): Promise<{
  success: boolean;
  imported: number;
  errors: string[];
}> {
  const supabase = createSupabaseServerActionClient();
  const errors: string[] = [];
  let imported = 0;

  for (const item of gearItems) {
    try {
      const gearData: Database['public']['Tables']['gear_items']['Insert'] = {
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || null,
        tier: item.tier || null,
        base_value: item.base_value || null,
        might_bonus: item.might_bonus || null,
        stats: item.stats ? JSON.stringify(item.stats) : null,
        rarity: item.rarity || null,
        game: item.game || 'Lords Mobile'
      };

      const { error } = await supabase
        .from('gear_items')
        .upsert(gearData as never, {
          onConflict: 'name,game',
          ignoreDuplicates: false
        });

      if (error) {
        errors.push(`Failed to import ${item.name}: ${error.message}`);
      } else {
        imported++;
      }
    } catch (error) {
      errors.push(`Error importing ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    success: errors.length === 0,
    imported,
    errors
  };
}

/**
 * Parse coordinates from various formats
 * Supports: "K:X:Y", "X:Y", "(X, Y)", etc.
 */
export function parseCoordinates(coordinateString: string | null): {
  k: string | null;
  x: string | null;
  y: string | null;
} {
  if (!coordinateString) {
    return { k: null, x: null, y: null };
  }

  // Try K:X:Y format
  const kxyMatch = coordinateString.match(/(\d+):(\d+):(\d+)/);
  if (kxyMatch) {
    return {
      k: kxyMatch[1],
      x: kxyMatch[2],
      y: kxyMatch[3]
    };
  }

  // Try X:Y format
  const xyMatch = coordinateString.match(/(\d+):(\d+)/);
  if (xyMatch) {
    return {
      k: null,
      x: xyMatch[1],
      y: xyMatch[2]
    };
  }

  // Try (X, Y) format
  const parenMatch = coordinateString.match(/\((\d+),\s*(\d+)\)/);
  if (parenMatch) {
    return {
      k: null,
      x: parenMatch[1],
      y: parenMatch[2]
    };
  }

  // Default: return as-is for x, null for k and y
  return {
    k: null,
    x: coordinateString.trim(),
    y: null
  };
}

