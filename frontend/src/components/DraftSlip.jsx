import { formatDetail } from '../lib/format';

export default function DraftSlip({ action }) {
  const details = action?.details || {};
  const entries = Object.entries(details);

  return (
    <div className="mt-4 rounded-md border-2 border-dashed border-steel bg-sheet p-4">
      <div className="flex items-center justify-between gap-3 border-b border-rule pb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Draft slip</p>
          <h4 className="font-display text-2xl font-semibold">{action?.sku}</h4>
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-steel">{action?.type}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="border-t border-rule pt-2">
            <dt className="text-steel">{formatDetail(key, value)}</dt>
            <dd className="font-semibold text-ink">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
