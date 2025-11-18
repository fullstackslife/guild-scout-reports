"use client";

type InfoSectionProps = {
  title: string;
  icon?: string;
  items: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
};

export function InfoSection({ title, icon = 'ℹ️', items }: InfoSectionProps) {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        background: '#111827',
        marginTop: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#cbd5f5', fontWeight: 600 }}>
          {title}
        </h3>
      </div>
      <div style={{ display: 'grid', gap: '1rem', color: '#cbd5f5', fontSize: '0.95rem', lineHeight: 1.6 }}>
        {items.map((item, index) => (
          <div key={index}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
              {item.icon} {item.title}
            </h4>
            <p style={{ margin: 0, color: '#94a3b8' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

