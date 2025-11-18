"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

interface ExtractTextRequest {
  screenshotId: string;
  imageUrl: string;
}

interface ExtractTextResponse {
  success: boolean;
  extractedText?: string;
  error?: string;
  processingStatus?: "completed" | "failed";
}

export async function extractTextFromScreenshot(
  request: ExtractTextRequest
): Promise<ExtractTextResponse> {
  try {
    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not set - skipping text extraction");
      return {
        success: false,
        error: "OCR service not configured"
      };
    }

    // Dynamic import to handle optional dependency
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let client: any;
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    } catch {
      console.warn("@anthropic-ai/sdk not available - skipping text extraction");
      return {
        success: false,
        error: "OCR service not available"
      };
    }

    // Call Claude Vision API
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: request.imageUrl
              }
            },
            {
              type: "text",
              text: `Extract all readable text from this game screenshot. 
              
Format the extracted text clearly, preserving the layout and structure as much as possible. Include:
- Headers and titles
- Player information and stats
- Guild or group information
- Timestamps and dates
- Any other visible text

If the image contains no readable text, respond with "No text found in image".`
            }
          ]
        }
      ]
    });

    // Extract text content from response
    const textContent = message.content.find(
      (block: { type: string }) => block.type === "text"
    ) as { type: string; text: string } | undefined;
    
    if (!textContent || textContent.type !== "text") {
      return {
        success: false,
        error: "No text response from Claude API"
      };
    }

    const extractedText = textContent.text;

    // Update database with extracted text
    const supabase = createSupabaseServerActionClient();

    const updateData: Database['public']['Tables']['screenshots']['Update'] = {
      extracted_text: extractedText,
      processing_status: "completed" as const
    };
    const { error: updateError } = await supabase
      .from("screenshots")
      .update(updateData as never)
      .eq("id", request.screenshotId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return {
        success: false,
        error: "Failed to save extracted text"
      };
    }

    // Trigger structured data parsing in the background (don't block)
    // Note: We don't store parsed data here - it will be parsed when user creates scout report
    // This is just a placeholder for future enhancement
    try {
      const { parseScoutReportFromText } = await import("./scout-report-parser");
      const { data: screenshot } = await supabase
        .from("screenshots")
        .select("guild_id, guilds(game)")
        .eq("id", request.screenshotId)
        .single();

      if (screenshot) {
        type ScreenshotWithGuild = {
          guild_id: string | null;
          guilds?: { game: string } | null;
        };
        const typedScreenshot = screenshot as ScreenshotWithGuild | null;
        const gameName = typedScreenshot?.guilds?.game;
        
        // Parse in background but don't store - user will trigger full parse when creating report
        parseScoutReportFromText({
          screenshotId: request.screenshotId,
          extractedText,
          gameName: gameName || undefined
        }).catch(err => {
          console.error("Failed to parse structured data:", err);
          // Don't fail OCR if parsing fails
        });
      }
    } catch (parseError) {
      console.error("Failed to trigger parsing:", parseError);
      // Continue - parsing is optional
    }

    return {
      success: true,
      extractedText,
      processingStatus: "completed"
    };
  } catch (error) {
    console.error("Text extraction error:", error);

    // Mark as failed in database
    const supabase = createSupabaseServerActionClient();
    try {
      const failedUpdate: Database['public']['Tables']['screenshots']['Update'] = {
        processing_status: "failed" as const
      };
      await supabase
        .from("screenshots")
        .update(failedUpdate as never)
        .eq("id", request.screenshotId);
    } catch (dbError) {
      console.error("Failed to update processing status:", dbError);
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: false,
      error: "Failed to extract text from screenshot"
    };
  }
}
