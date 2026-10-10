import { Button, EDGE, SeverityBadge } from './ui';
import EvidenceStrip from './EvidenceStrip';
import OptionsCompare from './OptionsCompare';
import DraftSlip from './DraftSlip';
import { KIND_LABEL, TYPE_LABEL } from '../lib/labels';

export default function ActionCard({ action, onDecide, compact = false }) {
  const evidence = action?.evidence || {};
  const risk = evidence.severity || 'low';
  const decision = evidence.decision || {};

  return (
    <article className={`rounded-md border border-rule bg-white p-4 sm:p-5 ${EDGE[risk] || EDGE.low} border-l-4`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-bold leading-none">{action?.evidence?.rank || 1}</span>
            <h3 className="font-display text-3xl font-semibold leading-none">{action?.sku}</h3>
          </div>
          <p className="mt-2 text-sm text-steel">{action?.evidence?.product?.name || action?.sku} • {action?.evidence?.location || 'all locations'}</p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={risk} />
          <span className="text-xs uppercase tracking-[0.2em] text-steel">{TYPE_LABEL[action?.type] || 'Issue'}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-sheet px-2 py-1 text-xs font-semibold text-ink">{KIND_LABEL[evidence.kind] || evidence.kind}</span>
      </div>

      <p className="mt-4 text-base text-ink">{action?.explanation || action?.reason || 'Issue detected.'}</p>

      <div className="mt-5">
        <EvidenceStrip evidence={evidence} />
      </div>

      <div className="mt-5 space-y-4">
        <OptionsCompare options={evidence.options || []} />
        {decision.reason && (
          <div className="rounded-md bg-sheet p-3 text-sm text-ink">
            <p className="font-semibold">Decision</p>
            <p className="mt-1">{decision.reason}</p>
          </div>
        )}
      </div>

      <DraftSlip action={action} />

      {!compact && (
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => onDecide(action.id, 'approve')}>Approve {action?.type === 'transfer' ? 'transfer' : action?.type === 'purchase_order' ? 'PO' : 'alert'}</Button>
          <Button variant="secondary" onClick={() => onDecide(action.id, 'reject')}>Reject</Button>
        </div>
      )}
    </article>
  );
}
