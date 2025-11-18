"use client";

import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

type ScreenshotCardProps = {
  id: string;
  signedUrl: string | null;
  label: string | null;
  extractedText: string | null;
  processingStatus: string | null;
  createdAt: string;
};

export function ScreenshotCard({
  id,
  signedUrl,
  label,
  extractedText,
  processingStatus,
  createdAt
}: ScreenshotCardProps) {
  return (
    <article
      key={id}
      style={{
        display: 'grid',
        gap: '1rem',
        borderRadius: '1rem',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: '#111827',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
      }}
    >
      {signedUrl ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%',
            background: '#0f172a',
            overflow: 'hidden'
          }}
        >
          <Image
            src={signedUrl}
            alt={label ?? 'Screenshot'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{
              objectFit: 'cover'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: '180px',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171'
          }}
        >
          Unable to load image
        </div>
      )}

      <div style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {label && (
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{label}</h3>
          )}
          <time style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </time>
        </div>

        {processingStatus === 'completed' && extractedText ? (
          <div
            style={{
              display: 'grid',
              gap: '0.5rem',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              paddingTop: '0.75rem'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: '#a78bfa',
                fontWeight: 600
              }}
            >
              Extracted Text
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#cbd5f5',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {extractedText}
            </p>
          </div>
        ) : processingStatus === 'pending' ? (
          <div
            style={{
              display: 'grid',
              gap: '0.5rem',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              paddingTop: '0.75rem'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#94a3b8'
              }}
            >
              Processing text extraction...
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

