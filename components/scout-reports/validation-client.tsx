"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState } from "react"; // Used in hooks below
import { getParsedScoutData } from "@/app/(protected)/scout-reports/[id]/actions";
import type { ParsedScoutReport } from "@/lib/scout-report-parser";
import type { Database } from "@/lib/supabase/database.types";

type ScoutReportRow = Database['public']['Tables']['scout_reports']['Row'];
type ValidationRow = Database['public']['Tables']['scout_report_validations']['Row'];

interface ValidationClientProps {
  reportData: ScoutReportRow;
  screenshotUrl: string;
  screenshotLabel: string | null;
  extractedText: string | null;
  processingStatus: string | null;
  validations: ValidationRow[];
}

export function ValidationClient({
  reportData,
  screenshotUrl,
  screenshotLabel,
  extractedText,
  processingStatus,
  validations
}: ValidationClientProps) {
  const [parsedData, setParsedData] = useState<ParsedScoutReport | null>(null);
  const [loadingParsed, setLoadingParsed] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Get screenshot ID from report
  const screenshotId = reportData.screenshot_id;

  const handleLoadParsed = async () => {
    setLoadingParsed(true);
    try {
      const result = await getParsedScoutData(screenshotId);
      if (result.success && result.parsedData) {
        setParsedData(result.parsedData as ParsedScoutReport);
        setShowComparison(true);
      }
    } catch (error) {
      console.error("Failed to load parsed data:", error);
    } finally {
      setLoadingParsed(false);
    }
  };

  // Parse validation data if available
  const latestValidation = validations.length > 0 ? validations[0] : null;
  const validationComparison: Record<string, {
    manual: unknown;
    parsed: unknown;
    match: boolean;
    difference?: number;
  }> | null = latestValidation?.fields_compared 
    ? JSON.parse(latestValidation.fields_compared) 
    : null;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>Data Validation</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {screenshotLabel && <><strong>Label:</strong> {screenshotLabel} • </>}
          Compare manual entry with OCR-parsed data to validate accuracy.
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Left: Screenshot */}
        <div>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>Screenshot</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt="Scout report screenshot"
            style={{
              width: "100%",
              borderRadius: "0.5rem",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              marginBottom: "1rem"
            }}
          />
          
          {/* OCR Status */}
          {extractedText && processingStatus === "completed" && (
            <div style={{
              padding: "1rem",
              borderRadius: "0.5rem",
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.3)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "#34d399", fontWeight: 600 }}>✓ OCR Complete</span>
                <button
                  type="button"
                  onClick={handleLoadParsed}
                  disabled={loadingParsed}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    background: loadingParsed ? '#475569' : '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    cursor: loadingParsed ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {loadingParsed ? "Loading..." : parsedData ? "Reload OCR Data" : "Parse OCR Data"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Extracted Text */}
        <div>
          <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>Extracted Text</h2>
          {extractedText ? (
            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              background: '#0f172a',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              maxHeight: '600px',
              overflow: 'auto',
              fontSize: '0.875rem',
              color: '#cbd5f5',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {extractedText}
            </div>
          ) : (
            <div style={{
              padding: '2rem',
              borderRadius: '0.5rem',
              background: '#0f172a',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              No extracted text available
            </div>
          )}
        </div>
      </div>

      {/* Comparison Section */}
      <div style={{
        padding: "2rem",
        borderRadius: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        background: "#111827",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Validation Comparison</h2>
          {parsedData && (
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: showComparison ? "#3b82f6" : "#475569",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              {showComparison ? "Hide" : "Show"} Comparison
            </button>
          )}
        </div>

        {/* Validation Results */}
        {latestValidation && (
          <div style={{
            padding: "1.5rem",
            borderRadius: "0.75rem",
            background: latestValidation.overall_match_percentage && latestValidation.overall_match_percentage >= 80
              ? "rgba(52, 211, 153, 0.1)"
              : latestValidation.overall_match_percentage && latestValidation.overall_match_percentage >= 60
              ? "rgba(251, 191, 36, 0.1)"
              : "rgba(248, 113, 113, 0.1)",
            border: `1px solid ${
              latestValidation.overall_match_percentage && latestValidation.overall_match_percentage >= 80
                ? "rgba(52, 211, 153, 0.3)"
                : latestValidation.overall_match_percentage && latestValidation.overall_match_percentage >= 60
                ? "rgba(251, 191, 36, 0.3)"
                : "rgba(248, 113, 113, 0.3)"
            }`,
            marginBottom: "1.5rem"
          }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>Latest Validation Results</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Match Percentage</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#e2e8f0" }}>
                  {latestValidation.overall_match_percentage?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Fields Differed</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#e2e8f0" }}>
                  {latestValidation.fields_that_differed?.length || 0}
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "0.25rem" }}>Validated</div>
                <div style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                  {new Date(latestValidation.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison */}
        {showComparison && parsedData && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
            {/* Manual Entry */}
            <div>
              <h3 style={{ margin: "0 0 1rem 0", color: "#60a5fa" }}>Manual Entry</h3>
              <div style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                background: "#0f172a",
                border: "1px solid rgba(96, 165, 250, 0.3)",
                maxHeight: "600px",
                overflow: "auto"
              }}>
                <DataDisplay data={reportData} />
              </div>
            </div>

            {/* OCR Parsed */}
            <div>
              <h3 style={{ margin: "0 0 1rem 0", color: "#34d399" }}>OCR Parsed</h3>
              <div style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                background: "#0f172a",
                border: "1px solid rgba(52, 211, 153, 0.3)",
                maxHeight: "600px",
                overflow: "auto"
              }}>
                <DataDisplay data={parsedData as Record<string, unknown>} />
              </div>
            </div>
          </div>
        )}

        {/* Field-by-Field Comparison */}
        {validationComparison && (
          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ margin: "0 0 1rem 0" }}>Field-by-Field Comparison</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {Object.entries(validationComparison).map(([field, comparison]) => (
                <div
                  key={field}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    background: comparison.match ? "rgba(52, 211, 153, 0.1)" : "rgba(248, 113, 113, 0.1)",
                    border: `1px solid ${comparison.match ? "rgba(52, 211, 153, 0.3)" : "rgba(248, 113, 113, 0.3)"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <strong style={{ color: "#e2e8f0" }}>{field.replace(/_/g, " ")}</strong>
                    <span style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      background: comparison.match ? "rgba(52, 211, 153, 0.2)" : "rgba(248, 113, 113, 0.2)",
                      color: comparison.match ? "#34d399" : "#f87171",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}>
                      {comparison.match ? "✓ Match" : "✗ Mismatch"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.875rem", color: "#cbd5f5" }}>
                    <div>
                      <span style={{ color: "#94a3b8" }}>Manual: </span>
                      {String(comparison.manual ?? "N/A")}
                    </div>
                    <div>
                      <span style={{ color: "#94a3b8" }}>Parsed: </span>
                      {String(comparison.parsed ?? "N/A")}
                    </div>
                  </div>
                  {comparison.difference !== undefined && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#94a3b8" }}>
                      Difference: {comparison.difference}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!parsedData && !latestValidation && (
          <div style={{
            padding: "2rem",
            borderRadius: "0.5rem",
            background: "#0f172a",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            textAlign: "center",
            color: "#94a3b8"
          }}>
            <p style={{ margin: "0 0 1rem 0" }}>No validation data available yet.</p>
            {extractedText && processingStatus === "completed" && (
              <button
                type="button"
                onClick={handleLoadParsed}
                disabled={loadingParsed}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: loadingParsed ? '#475569' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  cursor: loadingParsed ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {loadingParsed ? "Loading..." : "Parse OCR Data for Comparison"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
        <a
          href="/scout-reports/validation"
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            background: '#475569',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block"
          }}
        >
          Back to List
        </a>
        <a
          href={`/scout-reports/entry?screenshot_id=${screenshotId}`}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block"
          }}
        >
          Edit Data
        </a>
      </div>
    </div>
  );
}

function DataDisplay({ data }: { data: Record<string, unknown> }) {
  return (
    <div style={{ display: "grid", gap: "0.75rem", fontSize: "0.875rem" }}>
      {Object.entries(data).map(([key, value]) => {
        // Skip metadata fields
        if (['id', 'screenshot_id', 'user_id', 'guild_id', 'created_at', 'updated_at', 'parsed_data'].includes(key)) {
          return null;
        }
        
        if (value == null) return null;
        
        return (
          <div key={key} style={{ color: "#cbd5f5" }}>
            <strong style={{ color: "#e2e8f0" }}>{key.replace(/_/g, " ")}:</strong>{" "}
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </div>
        );
      })}
    </div>
  );
}

