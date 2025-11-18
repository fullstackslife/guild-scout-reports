"use server";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";

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
    let client: any;
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    } catch (importError) {
      console.warn("@anthropic-ai/sdk not available - skipping text extraction");
      return {
        success: false,
        error: "OCR service not available"
      };
    }

    // Call Claude Vision API
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
      (block: any) => block.type === "text"
    );
    if (!textContent || textContent.type !== "text") {
      return {
        success: false,
        error: "No text response from Claude API"
      };
    }

    const extractedText = textContent.text;

    // Update database with extracted text
    const supabase = createSupabaseServerActionClient();

    const { error: updateError } = await (supabase.from("screenshots") as any)
      .update({
        extracted_text: extractedText,
        processing_status: "completed"
      })
      .eq("id", request.screenshotId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return {
        success: false,
        error: "Failed to save extracted text"
      };
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
      await (supabase.from("screenshots") as any)
        .update({
          processing_status: "failed"
        })
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
