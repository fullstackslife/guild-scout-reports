/**
 * Enhanced OCR Parser for Scout Reports
 * 
 * Parses OCR-extracted text into structured scout report data.
 * Uses Claude API to intelligently extract game-specific data from text.
 */

"use server";

export interface ParsedScoutReport {
  // Target basics
  target_name?: string | null;
  target_guild?: string | null;
  coordinates?: string | null;
  might?: number | null;
  leader_present?: boolean | null;
  anti_scout_active?: boolean | null;
  
  // Defensive state
  wall_hp?: number | null;
  traps_total?: number | null;
  traps_types?: string | null;
  wall_heroes_count?: number | null;
  wall_heroes_details?: string | null;
  wall_familiars?: string | null;
  active_boosts?: string | null;
  
  // Army picture
  total_troops?: number | null;
  troop_breakdown?: string | null;
  reinforcements_count?: number | null;
  reinforcements_details?: string | null;
  garrisons_count?: number | null;
  garrisons_details?: string | null;
  coalition_inside?: boolean | null;
  coalition_details?: string | null;
  
  // Damage / recent combat
  wounded_in_infirmary?: number | null;
  damaged_traps_count?: number | null;
  retrieve_traps_info?: string | null;
  
  // Economic value
  resources_food?: number | null;
  resources_stone?: number | null;
  resources_ore?: number | null;
  resources_timber?: number | null;
  resources_gold?: number | null;
  resources_above_vault?: string | null;
  worth_it_farming?: boolean | null;
  worth_it_kills?: boolean | null;
}

export interface ParseScoutReportRequest {
  screenshotId: string;
  extractedText: string;
  gameName?: string;
}

export interface ParseScoutReportResponse {
  success: boolean;
  parsedData?: ParsedScoutReport;
  error?: string;
}

/**
 * Parse OCR text into structured scout report data
 */
export async function parseScoutReportFromText(
  request: ParseScoutReportRequest
): Promise<ParseScoutReportResponse> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: "ANTHROPIC_API_KEY not configured"
      };
    }

    // Dynamic import
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let client: any;
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    } catch {
      return {
        success: false,
        error: "Anthropic SDK not available"
      };
    }

    // Build prompt based on game type
    const gameContext = request.gameName || "Lords Mobile";
    const prompt = buildParsingPrompt(request.extractedText, gameContext);

    // Call Claude API to parse the text
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Extract JSON from response
    const textContent = message.content.find(
      (block: { type: string }) => block.type === "text"
    ) as { type: string; text: string } | undefined;

    if (!textContent || textContent.type !== "text") {
      return {
        success: false,
        error: "No text response from Claude API"
      };
    }

    // Parse JSON response
    let parsedData: ParsedScoutReport;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = textContent.text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       textContent.text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        parsedData = JSON.parse(jsonString) as ParsedScoutReport;
      } else {
        // Try to find JSON object in the text
        const jsonObjectMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          parsedData = JSON.parse(jsonObjectMatch[0]) as ParsedScoutReport;
        } else {
          throw new Error("No JSON object found in response");
        }
      }
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Response text:", textContent.text.substring(0, 500));
      return {
        success: false,
        error: `Failed to parse structured data: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
      };
    }

    return {
      success: true,
      parsedData
    };
  } catch (error) {
    console.error("Parse scout report error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Build the prompt for Claude to parse scout report data
 */
function buildParsingPrompt(extractedText: string, gameName: string): string {
  return `You are an expert at parsing game scout reports. Extract structured data from the following OCR text extracted from a ${gameName} scout report screenshot.

OCR Text:
${extractedText}

Extract the following information and return it as a JSON object. Use null for any fields that cannot be determined from the text.

Required JSON structure:
{
  "target_name": "string or null",
  "target_guild": "string or null",
  "coordinates": "string or null (format: X:Y or similar)",
  "might": "number or null",
  "leader_present": "boolean or null",
  "anti_scout_active": "boolean or null",
  "wall_hp": "number or null",
  "traps_total": "number or null",
  "traps_types": "string or null (comma-separated or JSON)",
  "wall_heroes_count": "number or null",
  "wall_heroes_details": "string or null (JSON with rank/grade info)",
  "wall_familiars": "string or null",
  "active_boosts": "string or null (JSON array of active boosts)",
  "total_troops": "number or null",
  "troop_breakdown": "string or null (JSON: {infantry: {t2: number, t3: number, ...}, cavalry: {...}, range: {...}})",
  "reinforcements_count": "number or null",
  "reinforcements_details": "string or null (JSON array of {sender_name, sender_guild, troop_count})",
  "garrisons_count": "number or null",
  "garrisons_details": "string or null (JSON array)",
  "coalition_inside": "boolean or null",
  "coalition_details": "string or null (JSON if coalition present)",
  "wounded_in_infirmary": "number or null",
  "damaged_traps_count": "number or null",
  "retrieve_traps_info": "string or null",
  "resources_food": "number or null",
  "resources_stone": "number or null",
  "resources_ore": "number or null",
  "resources_timber": "number or null",
  "resources_gold": "number or null",
  "resources_above_vault": "string or null (JSON or calculated)",
  "worth_it_farming": "boolean or null",
  "worth_it_kills": "boolean or null"
}

Important parsing rules:
1. Extract numbers carefully - look for patterns like "1,234,567" or "1.2M" (convert to actual numbers)
2. For troop breakdown, identify tier levels (T1, T2, T3, T4, T5) and troop types (Infantry, Cavalry, Range)
3. For coordinates, look for patterns like "X:Y", "(X, Y)", or similar
4. For boolean fields, look for indicators like "Yes/No", "Active/Inactive", checkmarks, etc.
5. If a field is not visible or unclear, use null
6. Preserve the exact structure - return valid JSON only, no markdown or extra text

Return only the JSON object, no additional explanation.`;
}

