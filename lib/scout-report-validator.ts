/**
 * Scout Report Validation System
 * 
 * Compares manual data entry with OCR-parsed data to:
 * 1. Validate accuracy
 * 2. Track user credibility
 * 3. Improve OCR parsing over time
 */

"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { ParsedScoutReport } from "./scout-report-parser";

export interface ValidationResult {
  overallMatchPercentage: number;
  fieldsCompared: Record<string, {
    manual: unknown;
    parsed: unknown;
    match: boolean;
    difference?: number;
  }>;
  fieldsThatDiffered: string[];
  userCorrections: Record<string, unknown>;
}

export interface ScoutReportData extends ParsedScoutReport {
  screenshot_id: string;
  user_id: string;
  guild_id?: string | null;
}

/**
 * Compare manual entry with OCR-parsed data and create validation record
 */
export async function validateScoutReportEntry(
  scoutReportId: string,
  manualData: ScoutReportData,
  parsedData: ParsedScoutReport
): Promise<{
  success: boolean;
  validationId?: string;
  result?: ValidationResult;
  error?: string;
}> {
  try {
    const supabase = createSupabaseServerActionClient();
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    // Compare fields
    const comparison = compareScoutReportData(manualData, parsedData);
    
    // Create validation record
    const validationRecord: Database['public']['Tables']['scout_report_validations']['Insert'] = {
      scout_report_id: scoutReportId,
      user_id: session.user.id,
      fields_compared: JSON.stringify(comparison.fieldsCompared),
      overall_match_percentage: comparison.overallMatchPercentage,
      fields_that_differed: comparison.fieldsThatDiffered,
      user_corrections: JSON.stringify(comparison.userCorrections)
    };

    const { data: validation, error: validationError } = await supabase
      .from('scout_report_validations')
      .insert(validationRecord as never)
      .select()
      .single();

    if (validationError) {
      console.error("Validation record creation failed:", validationError);
      return { success: false, error: "Failed to create validation record" };
    }

    type ValidationRow = {
      id: string;
    };
    const typedValidation = validation as ValidationRow | null;

    // Update credibility scores (async, don't block)
    updateCredibilityScore(manualData.user_id, manualData.guild_id || null, comparison)
      .catch(error => {
        console.error("Failed to update credibility score:", error);
      });

    return {
      success: true,
      validationId: typedValidation?.id,
      result: comparison
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Compare manual data with parsed data
 */
function compareScoutReportData(
  manual: ScoutReportData,
  parsed: ParsedScoutReport
): ValidationResult {
  const fieldsCompared: ValidationResult['fieldsCompared'] = {};
  const fieldsThatDiffered: string[] = [];
  const userCorrections: Record<string, unknown> = {};

  // List of fields to compare (excluding metadata fields)
  const fieldsToCompare = [
    'target_name',
    'target_guild',
    'coordinates',
    'coordinate_k',
    'coordinate_x',
    'coordinate_y',
    'might',
    'leader_present',
    'anti_scout_active',
    'wall_hp',
    'traps_total',
    'traps_types',
    'wall_heroes_count',
    'wall_heroes_details',
    'wall_familiars',
    'active_boosts',
    'total_troops',
    'troop_breakdown',
    'reinforcements_count',
    'reinforcements_details',
    'garrisons_count',
    'garrisons_details',
    'coalition_inside',
    'coalition_details',
    'wounded_in_infirmary',
    'damaged_traps_count',
    'retrieve_traps_info',
    'resources_food',
    'resources_stone',
    'resources_ore',
    'resources_timber',
    'resources_gold',
    'resources_above_vault',
    'worth_it_farming',
    'worth_it_kills'
  ] as const;

  let totalFields = 0;
  let matchingFields = 0;

  for (const field of fieldsToCompare) {
    const manualValue = manual[field];
    const parsedValue = parsed[field];

    // Skip if both are null/undefined
    if (manualValue == null && parsedValue == null) {
      continue;
    }

    totalFields++;

    const match = compareFieldValues(manualValue, parsedValue, field);
    
    fieldsCompared[field] = {
      manual: manualValue,
      parsed: parsedValue,
      match
    };

    if (match) {
      matchingFields++;
    } else {
      fieldsThatDiffered.push(field);
      // If manual value exists and differs, it's a user correction
      if (manualValue != null) {
        userCorrections[field] = manualValue;
      }

      // Calculate difference for numeric fields
      if (typeof manualValue === 'number' && typeof parsedValue === 'number') {
        const difference = Math.abs(manualValue - parsedValue);
        fieldsCompared[field].difference = difference;
      }
    }
  }

  const overallMatchPercentage = totalFields > 0 
    ? (matchingFields / totalFields) * 100 
    : 0;

  return {
    overallMatchPercentage: Math.round(overallMatchPercentage * 100) / 100,
    fieldsCompared,
    fieldsThatDiffered,
    userCorrections
  };
}

/**
 * Compare two field values with tolerance for numeric fields
 */
function compareFieldValues(
  manual: unknown,
  parsed: unknown,
  fieldName: string
): boolean {
  // Both null/undefined = match
  if (manual == null && parsed == null) {
    return true;
  }

  // One null, one not = no match
  if (manual == null || parsed == null) {
    return false;
  }

  // For numeric fields, allow small tolerance
  if (typeof manual === 'number' && typeof parsed === 'number') {
    // For large numbers (like might, wall_hp), allow 1% tolerance
    if (fieldName === 'might' || fieldName === 'wall_hp' || fieldName === 'total_troops') {
      const tolerance = Math.max(manual, parsed) * 0.01;
      return Math.abs(manual - parsed) <= tolerance;
    }
    // For smaller numbers, allow 5% tolerance or absolute 100, whichever is larger
    const tolerance = Math.max(Math.abs(manual) * 0.05, 100);
    return Math.abs(manual - parsed) <= tolerance;
  }

  // For boolean fields, exact match
  if (typeof manual === 'boolean' && typeof parsed === 'boolean') {
    return manual === parsed;
  }

  // For string fields, normalize and compare
  if (typeof manual === 'string' && typeof parsed === 'string') {
    const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
    return normalize(manual) === normalize(parsed);
  }

  // For JSON strings, parse and compare
  if (typeof manual === 'string' && typeof parsed === 'string') {
    try {
      const manualJson = JSON.parse(manual);
      const parsedJson = JSON.parse(parsed);
      return JSON.stringify(manualJson) === JSON.stringify(parsedJson);
    } catch {
      // Not JSON, fall through to string comparison
    }
  }

  // Default: strict equality
  return manual === parsed;
}

/**
 * Update user credibility score based on validation results
 */
async function updateCredibilityScore(
  userId: string,
  guildId: string | null,
  validation: ValidationResult
): Promise<void> {
  try {
    const supabase = createSupabaseServerActionClient();

    // Get or create credibility record
    let query = supabase
      .from('scout_report_credibility')
      .select('*')
      .eq('user_id', userId);
    
    if (guildId !== null) {
      query = query.eq('guild_id', guildId);
    } else {
      query = query.is('guild_id', null);
    }
    
    const { data: existing } = await query.maybeSingle();

    type CredibilityRow = {
      total_entries: number | null;
      accurate_entries: number | null;
      field_accuracy: string | null;
      id: string;
    };
    const typedExisting = existing as CredibilityRow | null;

    const isAccurate = validation.overallMatchPercentage >= 80; // 80% threshold
    const currentTotal = typedExisting?.total_entries || 0;
    const currentAccurate = typedExisting?.accurate_entries || 0;
    
    const newTotal = currentTotal + 1;
    const newAccurate = isAccurate ? currentAccurate + 1 : currentAccurate;
    const newAccuracy = (newAccurate / newTotal) * 100;

    // Determine reliability tier
    const reliabilityTier = getReliabilityTier(newAccuracy, newTotal);

    // Calculate field-specific accuracy
    const fieldAccuracy = calculateFieldAccuracy(
      typedExisting?.field_accuracy ? JSON.parse(typedExisting.field_accuracy) : {},
      validation.fieldsCompared
    );

    const updateData: Database['public']['Tables']['scout_report_credibility']['Update'] = {
      total_entries: newTotal,
      accurate_entries: newAccurate,
      accuracy_percentage: Math.round(newAccuracy * 100) / 100,
      reliability_tier: reliabilityTier,
      field_accuracy: JSON.stringify(fieldAccuracy),
      last_calculated_at: new Date().toISOString()
    };

    if (typedExisting) {
      await supabase
        .from('scout_report_credibility')
        .update(updateData as never)
        .eq('id', typedExisting.id);
    } else {
      await supabase
        .from('scout_report_credibility')
        .insert({
          user_id: userId,
          guild_id: guildId,
          ...updateData
        } as never);
    }
  } catch (error) {
    console.error("Credibility update error:", error);
    // Don't throw - this is a background operation
  }
}

/**
 * Determine reliability tier based on accuracy and sample size
 */
function getReliabilityTier(accuracy: number, totalEntries: number): string {
  if (totalEntries < 5) {
    return 'new';
  }
  if (accuracy >= 95 && totalEntries >= 20) {
    return 'expert';
  }
  if (accuracy >= 85 && totalEntries >= 10) {
    return 'reliable';
  }
  if (accuracy >= 70) {
    return 'good';
  }
  return 'needs_improvement';
}

/**
 * Calculate field-specific accuracy scores
 */
function calculateFieldAccuracy(
  existing: Record<string, number | { matches: number; total: number }>,
  fieldsCompared: ValidationResult['fieldsCompared']
): Record<string, number> {
  const fieldAccuracy: Record<string, number | { matches: number; total: number }> = { ...existing };

  for (const [field, comparison] of Object.entries(fieldsCompared)) {
    if (!fieldAccuracy[field]) {
      fieldAccuracy[field] = { matches: 0, total: 0 };
    }

    const stats = fieldAccuracy[field] as { matches: number; total: number };
    stats.total++;
    if (comparison.match) {
      stats.matches++;
    }

    // Calculate percentage
    fieldAccuracy[field] = stats.matches / stats.total;
  }

  // Convert all to numbers
  const result: Record<string, number> = {};
  for (const [field, value] of Object.entries(fieldAccuracy)) {
    result[field] = typeof value === 'number' ? value : value.matches / value.total;
  }

  return result;
}

