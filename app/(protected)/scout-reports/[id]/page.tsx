import { redirect } from "next/navigation";
import { SCREENSHOTS_BUCKET } from "@/lib/constants";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { DataEntryForm } from "@/components/scout-reports/data-entry-form";

export const dynamic = "force-dynamic";

export default async function ScoutReportDataEntryPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const screenshotId = params.id;

  // Get screenshot
  const { data: screenshot, error } = await supabase
    .from("screenshots")
    .select("id, file_path, extracted_text, processing_status, user_id, guild_id")
    .eq("id", screenshotId)
    .single();

  if (error || !screenshot) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Screenshot not found</h1>
      </div>
    );
  }

  type ScreenshotData = {
    id: string;
    file_path: string;
    extracted_text: string | null;
    processing_status: string | null;
    user_id: string;
    guild_id: string | null;
  };

  const typedScreenshot = screenshot as ScreenshotData;

  if (typedScreenshot.user_id !== session.user.id) {
    redirect("/dashboard");
  }

  // Check if scout report already exists
  const { data: existingReport } = await supabase
    .from("scout_reports")
    .select("id")
    .eq("screenshot_id", screenshotId)
    .maybeSingle();

  type ScoutReportRow = { id: string };
  const typedExistingReport = existingReport as ScoutReportRow | null;

  if (typedExistingReport) {
    redirect(`/scout-reports/view/${typedExistingReport.id}`);
  }

  // Generate signed URL for image
  const { data: signedUrlData } = await supabase.storage
    .from(SCREENSHOTS_BUCKET)
    .createSignedUrl(typedScreenshot.file_path, 60 * 60);

  const signedUrl = signedUrlData?.signedUrl || "";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>Enter Scout Report Data</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Fill in the details from the scout report screenshot. Use the &quot;Auto-fill from OCR&quot; button to pre-populate fields from extracted text.
        </p>
      </div>

      <DataEntryForm
        screenshotId={screenshotId}
        screenshotUrl={signedUrl}
        extractedText={typedScreenshot.extracted_text}
        onSuccess={() => {
          redirect("/dashboard");
        }}
      />
    </div>
  );
}

