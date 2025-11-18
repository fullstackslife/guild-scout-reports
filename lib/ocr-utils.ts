import { createSupabaseServerActionClient } from "@/lib/supabase/server";

/**
 * Triggers OCR processing for a screenshot
 * This is called after a screenshot is successfully uploaded
 */
export async function triggerOCRProcessing(
  screenshotId: string,
  signedUrl: string
): Promise<void> {
  // Don't block the upload - process in the background
  // In a production app, you'd queue this with a background job service

  try {
    // Import the OCR function dynamically
    const { extractTextFromScreenshot } = await import("./ocr");

    // Fire and forget - log errors but don't block
    extractTextFromScreenshot({
      screenshotId,
      imageUrl: signedUrl
    }).catch((error) => {
      console.error(`Failed to extract text for screenshot ${screenshotId}:`, error);
    });
  } catch (error) {
    console.error("Failed to trigger OCR processing:", error);
    // Silently fail - OCR is optional
  }
}

/**
 * Manually extract text from a screenshot by ID
 * Useful for retrying failed extractions
 */
export async function retryOCRForScreenshot(screenshotId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createSupabaseServerActionClient();

    // Get the screenshot
    const { data: screenshot, error: fetchError } = await supabase
      .from("screenshots")
      .select("id, file_path")
      .eq("id", screenshotId)
      .single();

    if (fetchError || !screenshot) {
      return {
        success: false,
        error: "Screenshot not found"
      };
    }

    // Type assertion for screenshot
    const typedScreenshot = screenshot as { id: string; file_path: string };

    // Generate signed URL
    const { SCREENSHOTS_BUCKET } = await import("@/lib/constants");
    const { data: signedUrlData } = await supabase.storage
      .from(SCREENSHOTS_BUCKET)
      .createSignedUrl(typedScreenshot.file_path, 60 * 60);

    if (!signedUrlData?.signedUrl) {
      return {
        success: false,
        error: "Failed to generate signed URL"
      };
    }

    // Trigger OCR
    const { extractTextFromScreenshot } = await import("./ocr");
    const result = await extractTextFromScreenshot({
      screenshotId,
      imageUrl: signedUrlData.signedUrl
    });

    return {
      success: result.success,
      error: result.error
    };
  } catch (error) {
    console.error("Retry OCR error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
