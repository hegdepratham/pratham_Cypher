import { inr, num, days } from '../lib/format';

const STATS = [
  { key: 'stock', label: 'In stock here', fmt: (v) => num(v, 0) },
  { key: 'demand_rate', label: 'Selling per day', fmt: (v) => num(v) },
  { key: 'runway_days', label: 'Stock lasts', fmt: days },
  { key: 'usual_lead_days', label: 'Usual supplier needs', fmt: days },
  { key: 'qty_outstanding', label: 'Units still owed', fmt: (v) => num(v, 0) },
  { key: 'days_overdue', label: 'Days overdue', fmt: (v) => num(v, 0) },
  { key: 'network_days_of_stock', label: 'Stock left, all locations', fmt: days },
  { key: 'total_stock', label: 'Units on hand, all locations', fmt: (v) => num(v, 0) },
  { key: 'stock_value', label: 'Cash tied up', fmt: inr },
  { key: 'cover_days', label: 'Days of cover', fmt: days },
];

export default function EvidenceStrip({ evidence }) {
  const shown = STATS.filter((s) => evidence[s.key] !== undefined && evidence[s.key] !== null);
  if (!shown.length) return null;

  const runsOutFirst = evidence.usual_lead_days != null && evidence.runway_days < evidence.usual_lead_days;

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
      {shown.map((s) => (
        <div key={s.key}>
          <dt className="text-sm text-steel">{s.label}</dt>
          <dd className={`font-display text-2xl font-semibold ${s.key === 'runway_days' && runsOutFirst ? 'text-high' : ''}`}>
            {s.fmt(evidence[s.key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
