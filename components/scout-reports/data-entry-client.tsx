"use client";

import { useState, useTransition } from "react";
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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["target-basics"]));

  const toggleSection = (section: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(section)) {
      newOpen.delete(section);
    } else {
      newOpen.add(section);
    }
    setOpenSections(newOpen);
  };

  if (state.success) {
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
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>Data Entry</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          {screenshotLabel && <><strong>Label:</strong> {screenshotLabel} • </>}
          {guildName && <><strong>Guild:</strong> {guildName} • </>}
          Enter structured data from the scout report screenshot. Click sections to expand/collapse.
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
      <form action={formAction} style={{ display: "grid", gap: "1rem" }}>
        <input type="hidden" name="screenshot_id" value={screenshotId} />

        {/* Collapsible Sections */}
        <CollapsibleSection
          id="target-basics"
          title="Target Basics"
          isOpen={openSections.has("target-basics")}
          onToggle={() => toggleSection("target-basics")}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <FormField label="Target Name" name="target_name" />
            <FormField label="Target Guild" name="target_guild" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              <FormField label="Kingdom (K)" name="coordinate_k" placeholder="K" />
              <FormField label="X Coordinate" name="coordinate_x" placeholder="X" />
              <FormField label="Y Coordinate" name="coordinate_y" placeholder="Y" />
            </div>
            <FormField label="Might" name="might" type="number" />
            <FormBooleanField label="Leader Present" name="leader_present" />
            <FormBooleanField label="Anti-Scout Active" name="anti_scout_active" />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="defensive-state"
          title="Defensive State"
          isOpen={openSections.has("defensive-state")}
          onToggle={() => toggleSection("defensive-state")}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <FormField label="Wall HP" name="wall_hp" type="number" />
            <FormField label="Traps Total" name="traps_total" type="number" />
            <FormField label="Traps Types" name="traps_types" placeholder="Comma-separated or JSON" />
            <FormField label="Wall Heroes Count" name="wall_heroes_count" type="number" />
            <FormTextAreaField label="Wall Heroes Details" name="wall_heroes_details" placeholder="JSON with rank/grade" rows={3} />
            <FormField label="Wall Familiars" name="wall_familiars" />
            <FormField label="Active Boosts" name="active_boosts" placeholder="JSON array" />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="army-picture"
          title="Army Picture - Troop Breakdown"
          isOpen={openSections.has("army-picture")}
          onToggle={() => toggleSection("army-picture")}
        >
          <TroopBreakdownForm />
        </CollapsibleSection>

        <CollapsibleSection
          id="reinforcements"
          title="Reinforcements & Garrisons"
          isOpen={openSections.has("reinforcements")}
          onToggle={() => toggleSection("reinforcements")}
        >
          <div style={{ display: "grid", gap: "1rem" }}>
            <FormField label="Reinforcements Count" name="reinforcements_count" type="number" />
            <FormTextAreaField label="Reinforcements Details" name="reinforcements_details" placeholder='JSON array: [{"sender_name": "...", "troop_count": 1000}]' rows={4} />
            <FormField label="Garrisons Count" name="garrisons_count" type="number" />
            <FormTextAreaField label="Garrisons Details" name="garrisons_details" rows={4} />
            <FormBooleanField label="Coalition Inside" name="coalition_inside" />
            <FormTextAreaField label="Coalition Details" name="coalition_details" rows={3} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="damage"
          title="Damage / Recent Combat"
          isOpen={openSections.has("damage")}
          onToggle={() => toggleSection("damage")}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <FormField label="Wounded in Infirmary" name="wounded_in_infirmary" type="number" />
            <FormField label="Damaged Traps Count" name="damaged_traps_count" type="number" />
            <FormField label="Retrieve Traps Info" name="retrieve_traps_info" />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="economic"
          title="Economic Value"
          isOpen={openSections.has("economic")}
          onToggle={() => toggleSection("economic")}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <FormField label="Food" name="resources_food" type="number" />
            <FormField label="Stone" name="resources_stone" type="number" />
            <FormField label="Ore" name="resources_ore" type="number" />
            <FormField label="Timber" name="resources_timber" type="number" />
            <FormField label="Gold" name="resources_gold" type="number" />
            <FormField label="Resources Above Vault" name="resources_above_vault" />
            <FormBooleanField label="Worth It (Farming)" name="worth_it_farming" />
            <FormBooleanField label="Worth It (Kills)" name="worth_it_kills" />
          </div>
        </CollapsibleSection>

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
  );
}

function CollapsibleSection({
  id,
  title,
  isOpen,
  onToggle,
  children
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div 
      id={id}
      style={{
        borderRadius: '0.75rem',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: '#111827',
        overflow: 'hidden'
      }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          background: 'transparent',
          border: 'none',
          color: '#e2e8f0',
          fontSize: '1.1rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left'
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TroopBreakdownForm() {
  const [troopData, setTroopData] = useState({
    infantry: { t1: '', t2: '', t3: '', t4: '', t5: '' },
    range: { t1: '', t2: '', t3: '', t4: '', t5: '' },
    cavalry: { t1: '', t2: '', t3: '', t4: '', t5: '' },
    siege: { t1: '', t2: '', t3: '', t4: '', t5: '' }
  });

  const updateTroopValue = (type: 'infantry' | 'range' | 'cavalry' | 'siege', tier: 't1' | 't2' | 't3' | 't4' | 't5', value: string) => {
    setTroopData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [tier]: value
      }
    }));
  };

  // Convert to JSON and store in hidden field
  const troopBreakdownJson = JSON.stringify(troopData);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <input type="hidden" name="troop_breakdown" value={troopBreakdownJson} />
      
      {/* Total Troops */}
      <div>
        <FormField label="Total Troops" name="total_troops" type="number" />
      </div>

      {/* Troop Breakdown Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#0f172a",
          borderRadius: "0.5rem",
          overflow: "hidden"
        }}>
          <thead>
            <tr style={{ background: "#1e293b" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", color: "#e2e8f0", fontWeight: 600, borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>Type</th>
              <th style={{ padding: "0.75rem", textAlign: "center", color: "#e2e8f0", fontWeight: 600, borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>T1</th>
              <th style={{ padding: "0.75rem", textAlign: "center", color: "#e2e8f0", fontWeight: 600, borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>T2</th>
              <th style={{ padding: "0.75rem", textAlign: "center", color: "#e2e8f0", fontWeight: 600, borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>T3</th>
              <th style={{ padding: "0.75rem", textAlign: "center", color: "#e2e8f0", fontWeight: 600, borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>T4</th>
              <th style={{ padding: "0.75rem", textAlign: "center", color: "#e2e8f0", fontWeight: 600, borderBottom: "1px solid rgba(148, 163, 184, 0.2)" }}>T5</th>
            </tr>
          </thead>
          <tbody>
            {(['infantry', 'range', 'cavalry', 'siege'] as const).map((type) => (
              <tr key={type} style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
                <td style={{ padding: "0.75rem", color: "#cbd5f5", fontWeight: 600, textTransform: "capitalize" }}>
                  {type === 'infantry' ? 'Infantry' : type === 'range' ? 'Range' : type === 'cavalry' ? 'Cavalry' : 'Siege'}
                </td>
                {(['t1', 't2', 't3', 't4', 't5'] as const).map((tier) => (
                  <td key={tier} style={{ padding: "0.5rem", textAlign: "center" }}>
                    <input
                      type="number"
                      value={troopData[type][tier]}
                      onChange={(e) => updateTroopValue(type, tier, e.target.value)}
                      placeholder="0"
                      style={{
                        width: "100%",
                        maxWidth: "100px",
                        padding: "0.5rem",
                        borderRadius: "0.25rem",
                        background: "#111827",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        color: "#e2e8f0",
                        fontSize: "0.9rem",
                        textAlign: "center"
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
  name
}: { 
  label: string; 
  name: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
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
