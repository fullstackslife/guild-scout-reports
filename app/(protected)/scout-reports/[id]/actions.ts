/**
 * Server actions for scout report data entry and management
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import { parseScoutReportFromText, type ParsedScoutReport } from "@/lib/scout-report-parser";
import { validateScoutReportEntry, type ScoutReportData } from "@/lib/scout-report-validator";
import type { Database } from "@/lib/supabase/database.types";

export type ScoutReportActionState = {
  error?: string;
  success?: string;
  parsedData?: unknown;
};

/**
 * Create a new scout report from a screenshot
 */
export async function createScoutReport(
  _prevState: ScoutReportActionState,
  formData: FormData
): Promise<ScoutReportActionState> {
  try {
    const supabase = createSupabaseServerActionClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { error: "Not authenticated" };
    }

    const screenshotId = formData.get("screenshot_id") as string | null;
    if (!screenshotId) {
      return { error: "Screenshot ID is required" };
    }

    // Get screenshot to verify ownership and get extracted text
    const { data: screenshot, error: screenshotError } = await supabase
      .from("screenshots")
      .select("id, user_id, guild_id, extracted_text, processing_status")
      .eq("id", screenshotId)
      .single();

    if (screenshotError || !screenshot) {
      return { error: "Screenshot not found" };
    }

    type ScreenshotData = {
      id: string;
      user_id: string;
      guild_id: string | null;
      extracted_text: string | null;
      processing_status: string | null;
    };

    const typedScreenshot = screenshot as ScreenshotData;

    if (typedScreenshot.user_id !== session.user.id) {
      return { error: "You can only create scout reports for your own screenshots" };
    }

    // Parse form data into scout report structure
    const scoutReportData: Database['public']['Tables']['scout_reports']['Insert'] = {
      screenshot_id: screenshotId,
      user_id: session.user.id,
      guild_id: typedScreenshot.guild_id,
      
      // Target basics
      target_name: (formData.get("target_name") as string | null)?.trim() || null,
      target_guild: (formData.get("target_guild") as string | null)?.trim() || null,
      coordinates: (() => {
        const k = (formData.get("coordinate_k") as string | null)?.trim() || null;
        const x = (formData.get("coordinate_x") as string | null)?.trim() || null;
        const y = (formData.get("coordinate_y") as string | null)?.trim() || null;
        if (k && x && y) return `${k}:${x}:${y}`;
        if (x && y) return `${x}:${y}`;
        return null;
      })(),
      coordinate_k: (formData.get("coordinate_k") as string | null)?.trim() || null,
      coordinate_x: (formData.get("coordinate_x") as string | null)?.trim() || null,
      coordinate_y: (formData.get("coordinate_y") as string | null)?.trim() || null,
      might: parseNumber(formData.get("might")),
      leader_present: parseBoolean(formData.get("leader_present")),
      anti_scout_active: parseBoolean(formData.get("anti_scout_active")),
      
      // Defensive state
      wall_hp: parseNumber(formData.get("wall_hp")),
      traps_total: parseNumber(formData.get("traps_total")),
      traps_types: (formData.get("traps_types") as string | null)?.trim() || null,
      wall_heroes_count: parseNumber(formData.get("wall_heroes_count")),
      wall_heroes_details: (formData.get("wall_heroes_details") as string | null)?.trim() || null,
      wall_familiars: (formData.get("wall_familiars") as string | null)?.trim() || null,
      active_boosts: (formData.get("active_boosts") as string | null)?.trim() || null,
      
      // Army picture
      total_troops: parseNumber(formData.get("total_troops")),
      troop_breakdown: (formData.get("troop_breakdown") as string | null)?.trim() || null, // JSON with structured breakdown
      reinforcements_count: parseNumber(formData.get("reinforcements_count")),
      reinforcements_details: (formData.get("reinforcements_details") as string | null)?.trim() || null,
      garrisons_count: parseNumber(formData.get("garrisons_count")),
      garrisons_details: (formData.get("garrisons_details") as string | null)?.trim() || null,
      coalition_inside: parseBoolean(formData.get("coalition_inside")),
      coalition_details: (formData.get("coalition_details") as string | null)?.trim() || null,
      
      // Damage / recent combat
      wounded_in_infirmary: parseNumber(formData.get("wounded_in_infirmary")),
      damaged_traps_count: parseNumber(formData.get("damaged_traps_count")),
      retrieve_traps_info: (formData.get("retrieve_traps_info") as string | null)?.trim() || null,
      
      // Economic value
      resources_food: parseNumber(formData.get("resources_food")),
      resources_stone: parseNumber(formData.get("resources_stone")),
      resources_ore: parseNumber(formData.get("resources_ore")),
      resources_timber: parseNumber(formData.get("resources_timber")),
      resources_gold: parseNumber(formData.get("resources_gold")),
      resources_above_vault: (formData.get("resources_above_vault") as string | null)?.trim() || null,
      worth_it_farming: parseBoolean(formData.get("worth_it_farming")),
      worth_it_kills: parseBoolean(formData.get("worth_it_kills")),
      
      parsed_data: null // Will be set after parsing
    };

    // If extracted text exists, try to parse it
    let parsedData: ParsedScoutReport | null = null;
    if (typedScreenshot.extracted_text && typedScreenshot.processing_status === "completed") {
      try {
        const parseResult = await parseScoutReportFromText({
          screenshotId,
          extractedText: typedScreenshot.extracted_text
        });
        
        if (parseResult.success && parseResult.parsedData) {
          parsedData = parseResult.parsedData;
          try {
            scoutReportData.parsed_data = JSON.stringify(parseResult.parsedData);
          } catch (jsonError) {
            console.error("Failed to stringify parsed data:", jsonError);
            // Continue without storing parsed data
          }
        } else {
          console.warn("Parse result not successful:", parseResult.error);
        }
      } catch (error) {
        console.error("Failed to parse scout report:", error);
        // Continue without parsed data - this is not critical
      }
    }

    // Insert scout report
    const { data: insertedReport, error: insertError } = await supabase
      .from("scout_reports")
      .insert(scoutReportData as never)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create scout report:", insertError);
      // Check if it's a table not found error
      if (insertError.message?.includes("relation") || insertError.message?.includes("does not exist")) {
        return { error: "Database table not found. Please run migrations: `supabase migration up`" };
      }
      return { error: `Failed to save scout report data: ${insertError.message || "Unknown error"}` };
    }

    type ScoutReportRow = Database['public']['Tables']['scout_reports']['Row'];
    const typedInsertedReport = insertedReport as ScoutReportRow | null;

    // If we have parsed data, validate the entry
    if (parsedData && typedInsertedReport) {
      try {
        // Create validation data by extracting fields from scoutReportData
        const validationData: ScoutReportData = {
          screenshot_id: screenshotId,
          user_id: session.user.id,
          guild_id: typedScreenshot.guild_id,
          target_name: scoutReportData.target_name,
          target_guild: scoutReportData.target_guild,
          coordinates: scoutReportData.coordinates,
          might: scoutReportData.might,
          leader_present: scoutReportData.leader_present,
          anti_scout_active: scoutReportData.anti_scout_active,
          wall_hp: scoutReportData.wall_hp,
          traps_total: scoutReportData.traps_total,
          traps_types: scoutReportData.traps_types,
          wall_heroes_count: scoutReportData.wall_heroes_count,
          wall_heroes_details: scoutReportData.wall_heroes_details,
          wall_familiars: scoutReportData.wall_familiars,
          active_boosts: scoutReportData.active_boosts,
          total_troops: scoutReportData.total_troops,
          troop_breakdown: scoutReportData.troop_breakdown,
          reinforcements_count: scoutReportData.reinforcements_count,
          reinforcements_details: scoutReportData.reinforcements_details,
          garrisons_count: scoutReportData.garrisons_count,
          garrisons_details: scoutReportData.garrisons_details,
          coalition_inside: scoutReportData.coalition_inside,
          coalition_details: scoutReportData.coalition_details,
          wounded_in_infirmary: scoutReportData.wounded_in_infirmary,
          damaged_traps_count: scoutReportData.damaged_traps_count,
          retrieve_traps_info: scoutReportData.retrieve_traps_info,
          resources_food: scoutReportData.resources_food,
          resources_stone: scoutReportData.resources_stone,
          resources_ore: scoutReportData.resources_ore,
          resources_timber: scoutReportData.resources_timber,
          resources_gold: scoutReportData.resources_gold,
          resources_above_vault: scoutReportData.resources_above_vault,
          worth_it_farming: scoutReportData.worth_it_farming,
          worth_it_kills: scoutReportData.worth_it_kills
        };
        
        await validateScoutReportEntry(
          typedInsertedReport.id,
          validationData,
          parsedData
        );
      } catch (error) {
        console.error("Validation failed:", error);
        // Don't fail the creation if validation fails
      }
    }

    revalidatePath("/scout-reports");
    revalidatePath("/scout-reports/entry");
    revalidatePath("/scout-reports/validation");
    revalidatePath("/dashboard");
    
    return {
      success: "Scout report created successfully",
      parsedData: parsedData || undefined
    };
  } catch (error) {
    console.error("createScoutReport error:", error);
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
    };
  }
}

/**
 * Get parsed data for a screenshot (for pre-filling form)
 */
export async function getParsedScoutData(
  screenshotId: string
): Promise<{ success: boolean; parsedData?: unknown; error?: string }> {
  const supabase = createSupabaseServerActionClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: screenshot, error } = await supabase
    .from("screenshots")
    .select("id, extracted_text, processing_status, user_id")
    .eq("id", screenshotId)
    .single();

  if (error || !screenshot) {
    return { success: false, error: "Screenshot not found" };
  }

  type ScreenshotData = {
    id: string;
    user_id: string;
    extracted_text: string | null;
    processing_status: string | null;
  };

  const typedScreenshot = screenshot as ScreenshotData;

  if (typedScreenshot.user_id !== session.user.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!typedScreenshot.extracted_text || typedScreenshot.processing_status !== "completed") {
    return { success: false, error: "OCR not completed yet" };
  }

  try {
    const parseResult = await parseScoutReportFromText({
      screenshotId,
      extractedText: typedScreenshot.extracted_text
    });

    if (parseResult.success && parseResult.parsedData) {
      return { success: true, parsedData: parseResult.parsedData };
    }

    return { success: false, error: parseResult.error || "Failed to parse data" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Helper functions
function parseNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: FormDataEntryValue | null): boolean | null {
  if (!value) return null;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "yes" || lower === "1") return true;
    if (lower === "false" || lower === "no" || lower === "0") return false;
  }
  return Boolean(value);
}

