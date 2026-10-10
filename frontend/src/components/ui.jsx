import { useEffect } from 'react';

export function Button({ variant = 'primary', busy = false, disabled, className = '', children, ...props }) {
  const styles = {
    primary: 'bg-hydraulic text-white hover:bg-hydraulic-dark',
    secondary: 'border border-steel bg-white text-ink hover:bg-sheet',
    danger: 'bg-high text-white hover:opacity-90',
  };

  return (
    <button
      type="button"
      disabled={busy || disabled}
      aria-busy={busy}
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const SEVERITY = {
  high: { label: 'High priority', classes: 'bg-high-tint text-high' },
  medium: { label: 'Medium priority', classes: 'bg-medium-tint text-medium' },
  low: { label: 'Low priority', classes: 'bg-low-tint text-low' },
};

export const EDGE = { high: 'border-l-high', medium: 'border-l-medium', low: 'border-l-low' };

export function SeverityBadge({ severity }) {
  const s = SEVERITY[severity] || SEVERITY.low;
  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${s.classes}`}>{s.label}</span>;
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-md border border-rule bg-white p-6" aria-hidden="true">
      <div className="h-4 w-24 rounded bg-rule" />
      <div className="mt-3 h-7 w-2/3 rounded bg-rule" />
      <div className="mt-4 h-4 w-full rounded bg-rule" />
      <div className="mt-2 h-4 w-5/6 rounded bg-rule" />
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="mt-8 rounded-md border border-dashed border-steel bg-white p-8 text-center">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-steel">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', error, onRetry }) {
  return (
    <div role="alert" className="mt-8 rounded-md border border-high bg-high-tint p-6">
      <h2 className="font-display text-2xl font-semibold text-high">{title}</h2>
      <p className="mt-2">{error?.message || 'Please try again.'}</p>
      {onRetry && <Button className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Notice({ notice, onDismiss }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-10 flex justify-center">
      {notice && (
        <p className={`pointer-events-auto max-w-lg rounded-md px-4 py-3 font-medium shadow-md ${notice.tone === 'error' ? 'bg-high text-white' : 'bg-ink text-white'}`}>
          {notice.text}
        </p>
      )}
    </div>
  );
}
