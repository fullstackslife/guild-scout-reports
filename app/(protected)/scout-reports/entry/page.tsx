import { redirect } from "next/navigation";
import { SCREENSHOTS_BUCKET } from "@/lib/constants";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { DataEntryClient } from "@/components/scout-reports/data-entry-client";

export const dynamic = "force-dynamic";

export default async function DataEntryPage({
  searchParams
}: {
  searchParams: { screenshot_id?: string };
}) {
  const supabase = createSupabaseServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const screenshotId = searchParams.screenshot_id;

  if (!screenshotId) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ margin: "0 0 1rem 0" }}>Data Entry</h1>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
          Please select a screenshot from your dashboard to enter scout report data.
        </p>
        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            background: "#3b82f6",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  // Get screenshot
  const { data: screenshot, error } = await supabase
    .from("screenshots")
    .select("id, file_path, user_id, guild_id, label")
    .eq("id", screenshotId)
    .single();

  if (error || !screenshot) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <h1>Screenshot not found</h1>
        <p style={{ color: "#94a3b8" }}>The screenshot you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
      </div>
    );
  }

  type ScreenshotData = {
    id: string;
    file_path: string;
    user_id: string;
    guild_id: string | null;
    label: string | null;
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
    redirect(`/scout-reports/validation?report_id=${typedExistingReport.id}`);
  }

  // Generate signed URL for image
  const { data: signedUrlData } = await supabase.storage
    .from(SCREENSHOTS_BUCKET)
    .createSignedUrl(typedScreenshot.file_path, 60 * 60);

  const signedUrl = signedUrlData?.signedUrl || "";

  // Get guild info if available
  let guildName: string | null = null;
  if (typedScreenshot.guild_id) {
    const { data: guild } = await supabase
      .from("guilds")
      .select("name")
      .eq("id", typedScreenshot.guild_id)
      .single();
    
    guildName = (guild as { name: string } | null)?.name || null;
  }

  return (
    <DataEntryClient
      screenshotId={screenshotId}
      screenshotUrl={signedUrl}
      screenshotLabel={typedScreenshot.label}
      guildName={guildName}
    />
  );
}
