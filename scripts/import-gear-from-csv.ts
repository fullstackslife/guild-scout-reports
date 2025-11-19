/**
 * Script to import gear data from CSV file
 * Parses the Lords Mobile gear CSV and imports into gear_items table
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { readFileSync } from "fs";
import { resolve } from "path";

interface GearRow {
  itemName: string;
  itemType: string;
  reqLevel: string;
  normalEvent: string;
  // Stats will be stored in JSONB
  [key: string]: string | undefined;
}

// Map CSV columns to our database structure
function parseGearRow(row: string[], headers: string[]): GearRow | null {
  if (row.length < 3) return null;
  
  const gear: Partial<GearRow> = {
    itemName: row[0]?.trim() || "",
    itemType: row[1]?.trim() || "",
    reqLevel: row[2]?.trim() || "",
    normalEvent: row[3]?.trim() || "Normal"
  };

  // Store all other columns as stats
  const stats: Record<string, unknown> = {};
  for (let i = 4; i < headers.length && i < row.length; i++) {
    const header = headers[i]?.trim();
    const value = row[i]?.trim();
    if (header && value && value !== "") {
      // Try to parse as number if it looks like a number
      const numValue = parseFloat(value.replace(/,/g, ""));
      if (!isNaN(numValue)) {
        stats[header] = numValue;
      } else {
        stats[header] = value;
      }
    }
  }

  return {
    ...gear,
    stats
  } as GearRow;
}

// Map item types to categories
function mapCategory(itemType: string): string {
  const type = itemType.toLowerCase();
  if (type.includes("leg") || type.includes("boot") || type.includes("greave") || type.includes("belt") || type.includes("tasset") || type.includes("chaps") || type.includes("sandals") || type.includes("walker") || type.includes("stomper")) {
    return "legs";
  }
  if (type.includes("armor") || type.includes("plate") || type.includes("mail") || type.includes("cuirass") || type.includes("robe") || type.includes("vest") || type.includes("garb") || type.includes("toga") || type.includes("saddle") || type.includes("carapace") || type.includes("mantle") || type.includes("pauldron") || type.includes("parka") || type.includes("coat") || type.includes("shield")) {
    return "armor";
  }
  if (type.includes("helmet") || type.includes("helm") || type.includes("hood") || type.includes("visage") || type.includes("hat") || type.includes("headdress") || type.includes("tuskhelm") || type.includes("coronet") || type.includes("bubblehelm")) {
    return "helmet";
  }
  if (type.includes("main") || type.includes("sword") || type.includes("axe") || type.includes("lance") || type.includes("rod") || type.includes("star") || type.includes("stinger") || type.includes("trident") || type.includes("lash") || type.includes("crossbow") || type.includes("flail") || type.includes("tomahawk") || type.includes("gale") || type.includes("orb") || type.includes("anchor") || type.includes("saw") || type.includes("claw") || type.includes("bite") || type.includes("crusher") || type.includes("cane") || type.includes("edge") || type.includes("blade") || type.includes("greatsword")) {
    return "main_hand";
  }
  if (type.includes("off") || type.includes("mitt") || type.includes("grip") || type.includes("scimitar") || type.includes("whisper") || type.includes("shield") || type.includes("crest") || type.includes("tome") || type.includes("claw") || type.includes("cube") || type.includes("star") || type.includes("mace") || type.includes("talon") || type.includes("fang") || type.includes("aegis") || type.includes("fist") || type.includes("switchblade") || type.includes("deep") || type.includes("pestilence") || type.includes("lantern") || type.includes("blade") || type.includes("codex") || type.includes("boomerang") || type.includes("lamp") || type.includes("light") || type.includes("katar")) {
    return "off_hand";
  }
  if (type.includes("accessory") || type.includes("ring") || type.includes("necklace") || type.includes("choker") || type.includes("circlet") || type.includes("relic") || type.includes("horn") || type.includes("drum") || type.includes("vial") || type.includes("scroll") || type.includes("iris") || type.includes("breath") || type.includes("seal") || type.includes("totem") || type.includes("anemone") || type.includes("cup") || type.includes("faith") || type.includes("valor") || type.includes("blessing") || type.includes("tear") || type.includes("hourglass") || type.includes("patch") || type.includes("pocketwatch") || type.includes("diamond") || type.includes("dust")) {
    return "accessory";
  }
  return "accessory"; // Default
}

// Determine rarity from event name or item name
function determineRarity(normalEvent: string, itemName: string): string {
  const event = normalEvent.toLowerCase();
  const name = itemName.toLowerCase();
  
  // Champion gear is typically mythic
  if (event.includes("champion") || name.includes("champion")) {
    return "mythic";
  }
  
  // Event gear is typically legendary
  if (event !== "normal" && event !== "") {
    return "legendary";
  }
  
  // Default to common for normal items
  return "common";
}

// Extract tier from requirement level
function extractTier(reqLevel: string): number | null {
  const level = parseInt(reqLevel);
  if (isNaN(level)) return null;
  
  // Rough tier mapping based on level
  if (level >= 55) return 5;
  if (level >= 45) return 4;
  if (level >= 35) return 3;
  if (level >= 25) return 2;
  return 1;
}

async function importGearFromCSV() {
  const csvPath = resolve(process.cwd(), "Copy of LM Gear (v. 2021-02; WIP) - Sheet1.csv");
  
  console.log("Reading CSV file...");
  const csvContent = readFileSync(csvPath, "utf-8");
  
  const lines = csvContent.split("\n").filter(line => line.trim());
  if (lines.length < 3) {
    console.error("CSV file is too short or invalid");
    return;
  }

  // Skip first 2 header rows, use 3rd row as actual headers
  const headerLine = lines[2];
  const headers = headerLine.split(",").map(h => h.trim());
  
  console.log(`Found ${headers.length} columns`);
  console.log(`Processing ${lines.length - 3} gear items...`);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase environment variables");
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  let imported = 0;
  let errors = 0;

  // Process each row (skip first 3 header rows)
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV (handling quoted fields)
    const row: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    row.push(current); // Add last field

    const gearData = parseGearRow(row, headers);
    if (!gearData || !gearData.itemName) {
      continue;
    }

    try {
      const category = mapCategory(gearData.itemType);
      const rarity = determineRarity(gearData.normalEvent, gearData.itemName);
      const tier = extractTier(gearData.reqLevel);

      // Extract key stats for easier querying
      const stats = gearData.stats || {};
      
      // Calculate base value (if available in stats)
      const baseValue = stats["EFFICIENCIES"] 
        ? parseFloat(String(stats["EFFICIENCIES"]).replace(/,/g, "")) 
        : null;

      const gearItem = {
        name: gearData.itemName,
        category: category,
        subcategory: gearData.itemType,
        tier: tier,
        base_value: baseValue ? Math.round(baseValue) : null,
        might_bonus: null, // Not in CSV, would need to calculate
        stats: stats,
        rarity: rarity,
        game: "Lords Mobile"
      };

      const { error } = await supabase
        .from("gear_items")
        .upsert(gearItem as never, {
          onConflict: "name,game",
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Error importing ${gearData.itemName}:`, error.message);
        errors++;
      } else {
        imported++;
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} items...`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${gearData.itemName}:`, error);
      errors++;
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Imported: ${imported}`);
  console.log(`Errors: ${errors}`);
}

// Run if called directly
if (require.main === module) {
  importGearFromCSV().catch(console.error);
}

export { importGearFromCSV };

