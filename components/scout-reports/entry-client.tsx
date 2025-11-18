"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { createScoutReport, getParsedScoutData, type ScoutReportActionState } from "@/app/(protected)/scout-reports/[id]/actions";
import type { ParsedScoutReport } from "@/lib/scout-report-parser";

interface ScoutReportEntryClientProps {
  screenshotId: string;
  screenshotUrl: string;
  screenshotLabel: string | null;
  extractedText: string | null;
  processingStatus: string | null;
  guildName: string | null;
}

const initialState: ScoutReportActionState = {};

export function ScoutReportEntryClient({
  screenshotId,
  screenshotUrl,
  screenshotLabel,
  extractedText,
  processingStatus,
  guildName
}: ScoutReportEntryClientProps) {
  const [state, formAction] = useFormState(createScoutReport, initialState);
  const [isPending] = useTransition();
  const [parsedData, setParsedData] = useState<ParsedScoutReport | null>(null);
  const [loadingParsed, setLoadingParsed] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [useParsedData, setUseParsedData] = useState(false);

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

  const handleUseParsedData = () => {
    setUseParsedData(true);
  };

  if (state.success) {
    return (
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        <div style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#34d399", fontSize: "1.5rem" }}>✅ Scout Report Created!</h2>
          <p style={{ margin: "0 0 1.5rem 0", color: "#cbd5f5" }}>{state.success}</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <a
              href="/dashboard"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                background: '#34d399',
                color: '#0f172a',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block"
              }}
            >
              Back to Dashboard
            </a>
            <a
              href={`/scout-reports/entry?screenshot_id=${screenshotId}`}
              style={{
                padding: '0.75rem 1.5rem',
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
              Enter Another Report
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>Scout Report Data Entry & Validation</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {screenshotLabel && <><strong>Label:</strong> {screenshotLabel} • </>}
          {guildName && <><strong>Guild:</strong> {guildName} • </>}
          Enter structured data from the scout report screenshot. Compare with OCR-parsed data for validation.
        </p>
      </div>

      {/* Error Display */}
      {state.error && (
        <div style={{
          padding: '1rem',
          borderRadius: '0.5rem',
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          color: '#f87171',
          marginBottom: '2rem'
        }}>
          {state.error}
        </div>
      )}

      {/* Main Content Grid */}
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
              {parsedData && (
                <button
                  type="button"
                  onClick={handleUseParsedData}
                  style={{
                    width: "100%",
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginTop: "0.5rem"
                  }}
                >
                  Use OCR Data to Fill Form
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: OCR Text Preview */}
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
          ) : processingStatus === "pending" ? (
            <div style={{
              padding: '2rem',
              borderRadius: '0.5rem',
              background: '#0f172a',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              Processing text extraction...
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

      {/* Data Entry Form */}
      <div style={{
        padding: "2rem",
        borderRadius: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        background: "#111827"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Data Entry Form</h2>
          {showComparison && parsedData && (
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

        <form action={formAction} style={{ display: "grid", gap: "2rem" }}>
          <input type="hidden" name="screenshot_id" value={screenshotId} />

          {/* Comparison View */}
          {showComparison && parsedData && (
            <div style={{
              padding: "1.5rem",
              borderRadius: "0.75rem",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              marginBottom: "1rem"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#60a5fa" }}>OCR Parsed Data Preview</h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
                fontSize: "0.875rem"
              }}>
                {Object.entries(parsedData).map(([key, value]) => {
                  if (value == null) return null;
                  return (
                    <div key={key} style={{ color: "#cbd5f5" }}>
                      <strong style={{ color: "#e2e8f0" }}>{key.replace(/_/g, " ")}:</strong>{" "}
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Sections */}
          <FormSection title="Target Basics">
            <FormField label="Target Name" name="target_name" defaultValue={useParsedData ? parsedData?.target_name || "" : ""} />
            <FormField label="Target Guild" name="target_guild" defaultValue={useParsedData ? parsedData?.target_guild || "" : ""} />
            <FormField label="Coordinates" name="coordinates" defaultValue={useParsedData ? parsedData?.coordinates || "" : ""} placeholder="X:Y" />
            <FormField label="Might" name="might" type="number" defaultValue={useParsedData ? parsedData?.might?.toString() || "" : ""} />
            <FormBooleanField label="Leader Present" name="leader_present" defaultValue={useParsedData ? parsedData?.leader_present : undefined} />
            <FormBooleanField label="Anti-Scout Active" name="anti_scout_active" defaultValue={useParsedData ? parsedData?.anti_scout_active : undefined} />
          </FormSection>

          <FormSection title="Defensive State">
            <FormField label="Wall HP" name="wall_hp" type="number" defaultValue={useParsedData ? parsedData?.wall_hp?.toString() || "" : ""} />
            <FormField label="Traps Total" name="traps_total" type="number" defaultValue={useParsedData ? parsedData?.traps_total?.toString() || "" : ""} />
            <FormField label="Traps Types" name="traps_types" defaultValue={useParsedData ? parsedData?.traps_types || "" : ""} placeholder="Comma-separated or JSON" />
            <FormField label="Wall Heroes Count" name="wall_heroes_count" type="number" defaultValue={useParsedData ? parsedData?.wall_heroes_count?.toString() || "" : ""} />
            <FormTextAreaField label="Wall Heroes Details" name="wall_heroes_details" defaultValue={useParsedData ? parsedData?.wall_heroes_details || "" : ""} placeholder="JSON with rank/grade" />
            <FormField label="Wall Familiars" name="wall_familiars" defaultValue={useParsedData ? parsedData?.wall_familiars || "" : ""} />
            <FormField label="Active Boosts" name="active_boosts" defaultValue={useParsedData ? parsedData?.active_boosts || "" : ""} placeholder="JSON array" />
          </FormSection>

          <FormSection title="Army Picture">
            <FormField label="Total Troops" name="total_troops" type="number" defaultValue={useParsedData ? parsedData?.total_troops?.toString() || "" : ""} />
            <FormTextAreaField label="Troop Breakdown" name="troop_breakdown" defaultValue={useParsedData ? parsedData?.troop_breakdown || "" : ""} placeholder='JSON: {"infantry": {"t2": 1000, "t3": 500}, ...}' />
            <FormField label="Reinforcements Count" name="reinforcements_count" type="number" defaultValue={useParsedData ? parsedData?.reinforcements_count?.toString() || "" : ""} />
            <FormTextAreaField label="Reinforcements Details" name="reinforcements_details" defaultValue={useParsedData ? parsedData?.reinforcements_details || "" : ""} placeholder='JSON array: [{"sender_name": "...", "troop_count": 1000}]' />
            <FormField label="Garrisons Count" name="garrisons_count" type="number" defaultValue={useParsedData ? parsedData?.garrisons_count?.toString() || "" : ""} />
            <FormTextAreaField label="Garrisons Details" name="garrisons_details" defaultValue={useParsedData ? parsedData?.garrisons_details || "" : ""} />
            <FormBooleanField label="Coalition Inside" name="coalition_inside" defaultValue={useParsedData ? parsedData?.coalition_inside : undefined} />
            <FormTextAreaField label="Coalition Details" name="coalition_details" defaultValue={useParsedData ? parsedData?.coalition_details || "" : ""} />
          </FormSection>

          <FormSection title="Damage / Recent Combat">
            <FormField label="Wounded in Infirmary" name="wounded_in_infirmary" type="number" defaultValue={useParsedData ? parsedData?.wounded_in_infirmary?.toString() || "" : ""} />
            <FormField label="Damaged Traps Count" name="damaged_traps_count" type="number" defaultValue={useParsedData ? parsedData?.damaged_traps_count?.toString() || "" : ""} />
            <FormField label="Retrieve Traps Info" name="retrieve_traps_info" defaultValue={useParsedData ? parsedData?.retrieve_traps_info || "" : ""} />
          </FormSection>

          <FormSection title="Economic Value">
            <FormField label="Food" name="resources_food" type="number" defaultValue={useParsedData ? parsedData?.resources_food?.toString() || "" : ""} />
            <FormField label="Stone" name="resources_stone" type="number" defaultValue={useParsedData ? parsedData?.resources_stone?.toString() || "" : ""} />
            <FormField label="Ore" name="resources_ore" type="number" defaultValue={useParsedData ? parsedData?.resources_ore?.toString() || "" : ""} />
            <FormField label="Timber" name="resources_timber" type="number" defaultValue={useParsedData ? parsedData?.resources_timber?.toString() || "" : ""} />
            <FormField label="Gold" name="resources_gold" type="number" defaultValue={useParsedData ? parsedData?.resources_gold?.toString() || "" : ""} />
            <FormField label="Resources Above Vault" name="resources_above_vault" defaultValue={useParsedData ? parsedData?.resources_above_vault || "" : ""} />
            <FormBooleanField label="Worth It (Farming)" name="worth_it_farming" defaultValue={useParsedData ? parsedData?.worth_it_farming : undefined} />
            <FormBooleanField label="Worth It (Kills)" name="worth_it_kills" defaultValue={useParsedData ? parsedData?.worth_it_kills : undefined} />
          </FormSection>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <a
              href="/dashboard"
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
              Cancel
            </a>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                background: isPending ? '#475569' : '#3b82f6',
                color: '#fff',
                border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              {isPending ? 'Saving...' : 'Save & Validate Scout Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSection({ 
  title, 
  children
}: { 
  title: string; 
  children: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      background: '#111827'
    }}>
      <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', color: '#e2e8f0' }}>{title}</h4>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

function FormField({ 
  label, 
  name, 
  type = "text", 
  defaultValue = "", 
  placeholder 
}: { 
  label: string; 
  name: string; 
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5f5', fontSize: '0.9rem' }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          background: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          color: '#e2e8f0',
          fontSize: '0.9rem'
        }}
      />
    </div>
  );
}

function FormTextAreaField({ 
  label, 
  name, 
  defaultValue = "", 
  placeholder,
  rows = 3
}: { 
  label: string; 
  name: string; 
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5f5', fontSize: '0.9rem' }}>
        {label}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          background: '#0f172a',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          color: '#e2e8f0',
          fontSize: '0.9rem',
          fontFamily: 'monospace',
          resize: 'vertical'
        }}
      />
    </div>
  );
}

function FormBooleanField({ 
  label, 
  name, 
  defaultValue 
}: { 
  label: string; 
  name: string; 
  defaultValue?: boolean | null;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultValue === true}
        value="true"
        style={{
          width: '1.25rem',
          height: '1.25rem',
          cursor: 'pointer'
        }}
      />
      <label style={{ color: '#cbd5f5', fontSize: '0.9rem', cursor: 'pointer' }}>
        {label}
      </label>
    </div>
  );
}

