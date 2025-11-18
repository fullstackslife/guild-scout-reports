import { retryOCRForScreenshot } from "@/lib/ocr-utils";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const screenshotId = params.id;

    if (!screenshotId) {
      return Response.json(
        { success: false, error: "Missing screenshot ID" },
        { status: 400 }
      );
    }

    const result = await retryOCRForScreenshot(screenshotId);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error || "Failed to extract text"
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Text extraction completed"
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
