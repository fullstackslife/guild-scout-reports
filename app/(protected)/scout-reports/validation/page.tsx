import { redirect } from "next/navigation";
import { SCREENSHOTS_BUCKET } from "@/lib/constants";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { ValidationClient } from "@/components/scout-reports/validation-client";
import type { Database } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export default async function ValidationPage({
  searchParams
}: {
  searchParams: { report_id?: string; screenshot_id?: string };
}) {
  const supabase = createSupabaseServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const reportId = searchParams.report_id;
  const screenshotId = searchParams.screenshot_id;

  // If report_id provided, get that report
  if (reportId) {
    const { data: report, error } = await supabase
      .from("scout_reports")
      .select(`
        *,
        screenshots (
          id,
          file_path,
          extracted_text,
          processing_status,
          label
        )
      `)
      .eq("id", reportId)
      .single();

    if (error || !report) {
      return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
          <h1>Scout Report not found</h1>
          <p style={{ color: "#94a3b8" }}>The scout report you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      );
    }

    type ReportWithScreenshot = Database['public']['Tables']['scout_reports']['Row'] & {
      screenshots: {
        id: string;
        file_path: string;
        extracted_text: string | null;
        processing_status: string | null;
        label: string | null;
      } | null;
    };

    const typedReport = report as ReportWithScreenshot;

    // Check access
    if (typedReport.user_id !== session.user.id) {
      redirect("/dashboard");
    }

    // Get screenshot URL
    const screenshot = typedReport.screenshots;
    if (!screenshot) {
      return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
          <h1>Screenshot not found</h1>
        </div>
      );
    }

    const { data: signedUrlData } = await supabase.storage
      .from(SCREENSHOTS_BUCKET)
      .createSignedUrl(screenshot.file_path, 60 * 60);

    const signedUrl = signedUrlData?.signedUrl || "";

    // Get validation records
    const { data: validations } = await supabase
      .from("scout_report_validations")
      .select("*")
      .eq("scout_report_id", reportId)
      .order("created_at", { ascending: false });

    return (
      <ValidationClient
        reportData={typedReport}
        screenshotUrl={signedUrl}
        screenshotLabel={screenshot.label}
        extractedText={screenshot.extracted_text}
        processingStatus={screenshot.processing_status}
        validations={validations || []}
      />
    );
  }

  // If screenshot_id provided, find or create report
  if (screenshotId) {
    const { data: report } = await supabase
      .from("scout_reports")
      .select("id")
      .eq("screenshot_id", screenshotId)
      .maybeSingle();

    if (report) {
      redirect(`/scout-reports/validation?report_id=${report.id}`);
    } else {
      return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
          <h1>No Scout Report Found</h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
            No scout report exists for this screenshot yet. Please enter the data first.
          </p>
          <a
            href={`/scout-reports/entry?screenshot_id=${screenshotId}`}
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
            Go to Data Entry
          </a>
        </div>
      );
    }
  }

  // No parameters - show list of reports to validate
  const { data: reports } = await supabase
    .from("scout_reports")
    .select(`
      id,
      created_at,
      target_name,
      screenshots (
        label
      )
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ margin: "0 0 1rem 0" }}>Data Validation</h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        Select a scout report to validate against OCR-parsed data.
      </p>

      {reports && reports.length > 0 ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          {reports.map((report: {
            id: string;
            created_at: string;
            target_name: string | null;
            screenshots: { label: string | null } | null;
          }) => (
            <a
              key={report.id}
              href={`/scout-reports/validation?report_id=${report.id}`}
              style={{
                display: "block",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "#111827",
                textDecoration: "none",
                color: "#e2e8f0",
                transition: "border-color 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.5rem 0" }}>
                    {report.target_name || report.screenshots?.label || "Unnamed Report"}
                  </h3>
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.875rem" }}>
                    Created {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span style={{ color: "#3b82f6" }}>→</span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div style={{
          padding: "3rem",
          borderRadius: "0.75rem",
          border: "1px dashed rgba(148, 163, 184, 0.4)",
          background: "#0f172a",
          textAlign: "center"
        }}>
          <p style={{ margin: "0 0 1rem 0", color: "#94a3b8" }}>No scout reports found.</p>
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
      )}
    </div>
  );
}

