"use client";

import { useEffect, useRef, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { uploadScreenshot, type UploadState } from '@/app/(protected)/dashboard/actions';

const initialState: UploadState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: '0.75rem 1.25rem',
        borderRadius: '0.75rem',
        border: 'none',
        background: pending ? '#1e293b' : '#38bdf8',
        color: '#0f172a',
        fontWeight: 600,
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s ease'
      }}
    >
      {pending ? 'Uploading…' : 'Upload screenshot'}
    </button>
  );
}

export function UploadScreenshotForm() {
  const [state, formAction] = useFormState(uploadScreenshot, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state?.success]);

  return (
    <form
      ref={formRef}
      action={(formData: FormData) =>
        startTransition(async () => {
          await formAction(formData);
        })
      }
      style={{
        display: 'grid',
        gap: '1rem',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: '#111827'
      }}
    >
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <label htmlFor="file" style={{ fontWeight: 600, color: '#cbd5f5' }}>
          Screenshot file
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*"
          required
          style={{
            padding: '0.6rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            color: '#e2e8f0'
          }}
        />
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <label htmlFor="label" style={{ fontWeight: 600, color: '#cbd5f5' }}>
          Description (optional)
        </label>
        <input
          id="label"
          name="label"
          type="text"
          maxLength={200}
          placeholder="Example: Week 3 raid boss"
          style={{
            padding: '0.6rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            color: '#e2e8f0'
          }}
        />
      </div>
      {state?.error ? (
        <div style={{ color: '#f87171', fontSize: '0.95rem' }}>{state.error}</div>
      ) : null}
      {state?.success ? (
        <div style={{ color: '#34d399', fontSize: '0.95rem' }}>{state.success}</div>
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SubmitButton />
      </div>
    </form>
  );
}
