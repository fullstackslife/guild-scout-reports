"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { createScoutReport, type ScoutReportActionState } from "@/app/(protected)/scout-reports/[id]/actions";

interface DataEntryClientProps {
  screenshotId: string;
  screenshotUrl: string;
  screenshotLabel: string | null;
  guildName: string | null;
}

const initialState: ScoutReportActionState = {};

export function DataEntryClient({
  screenshotId,
  screenshotUrl,
  screenshotLabel,
  guildName
}: DataEntryClientProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(createScoutReport, initialState);
  const [isPending] = useTransition();

  if (state.success) {
    // Redirect to validation page after successful entry
    // We'll need to get the report ID from the response or redirect to a list
    setTimeout(() => {
      router.push("/scout-reports/validation");
    }, 1500);

    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <div style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: "0 0 1rem 0", color: "#34d399", fontSize: "1.5rem" }}>✅ Data Entry Complete!</h2>
          <p style={{ margin: "0 0 1.5rem 0", color: "#cbd5f5" }}>{state.success}</p>
          <p style={{ margin: 0, color: "#94a3b8" }}>Redirecting to validation page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>Data Entry</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {screenshotLabel && <><strong>Label:</strong> {screenshotLabel} • </>}
          {guildName && <><strong>Guild:</strong> {guildName} • </>}
          Enter structured data from the scout report screenshot.
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

      {/* Screenshot Preview */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>Screenshot Reference</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl}
          alt="Scout report screenshot"
          style={{
            width: "100%",
            maxWidth: "800px",
            borderRadius: "0.5rem",
            border: "1px solid rgba(148, 163, 184, 0.2)"
          }}
        />
      </div>

      {/* Data Entry Form */}
      <div style={{
        padding: "2rem",
        borderRadius: "1rem",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        background: "#111827"
      }}>
        <h2 style={{ margin: "0 0 2rem 0", fontSize: "1.5rem" }}>Enter Scout Report Data</h2>

        <form action={formAction} style={{ display: "grid", gap: "2rem" }}>
          <input type="hidden" name="screenshot_id" value={screenshotId} />

          <FormSection title="Target Basics">
            <FormField label="Target Name" name="target_name" />
            <FormField label="Target Guild" name="target_guild" />
            <FormField label="Coordinates" name="coordinates" placeholder="X:Y" />
            <FormField label="Might" name="might" type="number" />
            <FormBooleanField label="Leader Present" name="leader_present" />
            <FormBooleanField label="Anti-Scout Active" name="anti_scout_active" />
          </FormSection>

          <FormSection title="Defensive State">
            <FormField label="Wall HP" name="wall_hp" type="number" />
            <FormField label="Traps Total" name="traps_total" type="number" />
            <FormField label="Traps Types" name="traps_types" placeholder="Comma-separated or JSON" />
            <FormField label="Wall Heroes Count" name="wall_heroes_count" type="number" />
            <FormTextAreaField label="Wall Heroes Details" name="wall_heroes_details" placeholder="JSON with rank/grade" />
            <FormField label="Wall Familiars" name="wall_familiars" />
            <FormField label="Active Boosts" name="active_boosts" placeholder="JSON array" />
          </FormSection>

          <FormSection title="Army Picture">
            <FormField label="Total Troops" name="total_troops" type="number" />
            <FormTextAreaField label="Troop Breakdown" name="troop_breakdown" placeholder='JSON: {"infantry": {"t2": 1000, "t3": 500}, ...}' />
            <FormField label="Reinforcements Count" name="reinforcements_count" type="number" />
            <FormTextAreaField label="Reinforcements Details" name="reinforcements_details" placeholder='JSON array: [{"sender_name": "...", "troop_count": 1000}]' />
            <FormField label="Garrisons Count" name="garrisons_count" type="number" />
            <FormTextAreaField label="Garrisons Details" name="garrisons_details" />
            <FormBooleanField label="Coalition Inside" name="coalition_inside" />
            <FormTextAreaField label="Coalition Details" name="coalition_details" />
          </FormSection>

          <FormSection title="Damage / Recent Combat">
            <FormField label="Wounded in Infirmary" name="wounded_in_infirmary" type="number" />
            <FormField label="Damaged Traps Count" name="damaged_traps_count" type="number" />
            <FormField label="Retrieve Traps Info" name="retrieve_traps_info" />
          </FormSection>

          <FormSection title="Economic Value">
            <FormField label="Food" name="resources_food" type="number" />
            <FormField label="Stone" name="resources_stone" type="number" />
            <FormField label="Ore" name="resources_ore" type="number" />
            <FormField label="Timber" name="resources_timber" type="number" />
            <FormField label="Gold" name="resources_gold" type="number" />
            <FormField label="Resources Above Vault" name="resources_above_vault" />
            <FormBooleanField label="Worth It (Farming)" name="worth_it_farming" />
            <FormBooleanField label="Worth It (Kills)" name="worth_it_kills" />
          </FormSection>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", paddingTop: "1rem", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
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
              {isPending ? 'Saving...' : 'Save & Continue to Validation'}
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
      background: '#0f172a'
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
  placeholder 
}: { 
  label: string; 
  name: string; 
  type?: string;
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
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          background: '#111827',
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
  placeholder,
  rows = 3
}: { 
  label: string; 
  name: string; 
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
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          background: '#111827',
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
  name
}: { 
  label: string; 
  name: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="checkbox"
        name={name}
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

