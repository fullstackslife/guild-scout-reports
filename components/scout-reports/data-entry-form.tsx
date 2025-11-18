"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { createScoutReport, getParsedScoutData, type ScoutReportActionState } from "@/app/(protected)/scout-reports/[id]/actions";
import type { ParsedScoutReport } from "@/lib/scout-report-parser";

interface DataEntryFormProps {
  screenshotId: string;
  screenshotUrl: string;
  extractedText?: string | null;
  onSuccess?: () => void;
}

const initialState: ScoutReportActionState = {};

export function DataEntryForm({ 
  screenshotId, 
  screenshotUrl, 
  extractedText,
  onSuccess 
}: DataEntryFormProps) {
  const [state, formAction] = useFormState(createScoutReport, initialState);
  const [isPending] = useTransition();
  const [parsedData, setParsedData] = useState<ParsedScoutReport | null>(null);
  const [loadingParsed, setLoadingParsed] = useState(false);

  const handleLoadParsed = async () => {
    setLoadingParsed(true);
    try {
      const result = await getParsedScoutData(screenshotId);
      if (result.success && result.parsedData) {
        setParsedData(result.parsedData as ParsedScoutReport);
      }
    } catch (error) {
      console.error("Failed to load parsed data:", error);
    } finally {
      setLoadingParsed(false);
    }
  };

  if (state.success) {
    return (
      <div style={{
        padding: '2rem',
        borderRadius: '1rem',
        background: 'rgba(52, 211, 153, 0.1)',
        border: '1px solid rgba(52, 211, 153, 0.3)',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#34d399' }}>✅ Scout Report Created!</h3>
        <p style={{ margin: 0, color: '#cbd5f5' }}>{state.success}</p>
        {onSuccess && (
          <button
            onClick={onSuccess}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              background: '#34d399',
              color: '#0f172a',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Screenshot Preview */}
      <div>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Screenshot</h3>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl}
          alt="Scout report screenshot"
          style={{
            maxWidth: '100%',
            borderRadius: '0.5rem',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}
        />
      </div>

      {/* OCR Text Preview */}
      {extractedText && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Extracted Text</h3>
            <button
              type="button"
              onClick={handleLoadParsed}
              disabled={loadingParsed}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                background: loadingParsed ? '#475569' : '#3b82f6',
                color: '#fff',
                border: 'none',
                cursor: loadingParsed ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {loadingParsed ? 'Loading...' : 'Auto-fill from OCR'}
            </button>
          </div>
          <div style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            background: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            maxHeight: '200px',
            overflow: 'auto',
            fontSize: '0.875rem',
            color: '#cbd5f5',
            whiteSpace: 'pre-wrap'
          }}>
            {extractedText}
          </div>
        </div>
      )}

      {/* Data Entry Form */}
      <form action={formAction} style={{ display: 'grid', gap: '2rem' }}>
        <input type="hidden" name="screenshot_id" value={screenshotId} />

        {state.error && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            color: '#f87171'
          }}>
            {state.error}
          </div>
        )}

        {/* Target Basics Section */}
        <FormSection title="Target Basics">
          <FormField label="Target Name" name="target_name" defaultValue={parsedData?.target_name || ''} />
          <FormField label="Target Guild" name="target_guild" defaultValue={parsedData?.target_guild || ''} />
          <FormField label="Coordinates" name="coordinates" defaultValue={parsedData?.coordinates || ''} placeholder="X:Y" />
          <FormField label="Might" name="might" type="number" defaultValue={parsedData?.might?.toString() || ''} />
          <FormBooleanField label="Leader Present" name="leader_present" defaultValue={parsedData?.leader_present} />
          <FormBooleanField label="Anti-Scout Active" name="anti_scout_active" defaultValue={parsedData?.anti_scout_active} />
        </FormSection>

        {/* Defensive State Section */}
        <FormSection title="Defensive State">
          <FormField label="Wall HP" name="wall_hp" type="number" defaultValue={parsedData?.wall_hp?.toString() || ''} />
          <FormField label="Traps Total" name="traps_total" type="number" defaultValue={parsedData?.traps_total?.toString() || ''} />
          <FormField label="Traps Types" name="traps_types" defaultValue={parsedData?.traps_types || ''} placeholder="Comma-separated or JSON" />
          <FormField label="Wall Heroes Count" name="wall_heroes_count" type="number" defaultValue={parsedData?.wall_heroes_count?.toString() || ''} />
          <FormField label="Wall Heroes Details" name="wall_heroes_details" defaultValue={parsedData?.wall_heroes_details || ''} placeholder="JSON with rank/grade" />
          <FormField label="Wall Familiars" name="wall_familiars" defaultValue={parsedData?.wall_familiars || ''} />
          <FormField label="Active Boosts" name="active_boosts" defaultValue={parsedData?.active_boosts || ''} placeholder="JSON array" />
        </FormSection>

        {/* Army Picture Section */}
        <FormSection title="Army Picture">
          <FormField label="Total Troops" name="total_troops" type="number" defaultValue={parsedData?.total_troops?.toString() || ''} />
          <FormTextAreaField label="Troop Breakdown" name="troop_breakdown" defaultValue={parsedData?.troop_breakdown || ''} placeholder='JSON: {"infantry": {"t2": 1000, "t3": 500}, ...}' />
          <FormField label="Reinforcements Count" name="reinforcements_count" type="number" defaultValue={parsedData?.reinforcements_count?.toString() || ''} />
          <FormTextAreaField label="Reinforcements Details" name="reinforcements_details" defaultValue={parsedData?.reinforcements_details || ''} placeholder='JSON array: [{"sender_name": "...", "troop_count": 1000}]' />
          <FormField label="Garrisons Count" name="garrisons_count" type="number" defaultValue={parsedData?.garrisons_count?.toString() || ''} />
          <FormTextAreaField label="Garrisons Details" name="garrisons_details" defaultValue={parsedData?.garrisons_details || ''} />
          <FormBooleanField label="Coalition Inside" name="coalition_inside" defaultValue={parsedData?.coalition_inside} />
          <FormTextAreaField label="Coalition Details" name="coalition_details" defaultValue={parsedData?.coalition_details || ''} />
        </FormSection>

        {/* Damage / Recent Combat Section */}
        <FormSection title="Damage / Recent Combat">
          <FormField label="Wounded in Infirmary" name="wounded_in_infirmary" type="number" defaultValue={parsedData?.wounded_in_infirmary?.toString() || ''} />
          <FormField label="Damaged Traps Count" name="damaged_traps_count" type="number" defaultValue={parsedData?.damaged_traps_count?.toString() || ''} />
          <FormField label="Retrieve Traps Info" name="retrieve_traps_info" defaultValue={parsedData?.retrieve_traps_info || ''} />
        </FormSection>

        {/* Economic Value Section */}
        <FormSection title="Economic Value">
          <FormField label="Food" name="resources_food" type="number" defaultValue={parsedData?.resources_food?.toString() || ''} />
          <FormField label="Stone" name="resources_stone" type="number" defaultValue={parsedData?.resources_stone?.toString() || ''} />
          <FormField label="Ore" name="resources_ore" type="number" defaultValue={parsedData?.resources_ore?.toString() || ''} />
          <FormField label="Timber" name="resources_timber" type="number" defaultValue={parsedData?.resources_timber?.toString() || ''} />
          <FormField label="Gold" name="resources_gold" type="number" defaultValue={parsedData?.resources_gold?.toString() || ''} />
          <FormField label="Resources Above Vault" name="resources_above_vault" defaultValue={parsedData?.resources_above_vault || ''} />
          <FormBooleanField label="Worth It (Farming)" name="worth_it_farming" defaultValue={parsedData?.worth_it_farming} />
          <FormBooleanField label="Worth It (Kills)" name="worth_it_kills" defaultValue={parsedData?.worth_it_kills} />
        </FormSection>

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
          {isPending ? 'Saving...' : 'Save Scout Report'}
        </button>
      </form>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
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

