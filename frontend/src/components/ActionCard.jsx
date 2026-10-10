import DecisionBar from './DecisionBar'
import { useState } from 'react'
import { SeverityBadge, EDGE } from './ui'
import EvidenceStrip from './EvidenceStrip'
import OptionsCompare from './OptionsCompare'
import DraftSlip from './DraftSlip'
import { KIND_LABEL } from '../lib/labels'

export default function ActionCard({
  action,
  position,
  defaultOpen = false,
  onDecide,
}) {
  const { id, type, sku, details, explanation } = action
  const evidence = action.evidence || {}
  const [open, setOpen] = useState(defaultOpen)

  const title = evidence.product?.name || sku

  const subtitle = [
    sku,
    evidence.product?.machine_model,
    evidence.location && `at ${evidence.location}`,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <article
      aria-labelledby={`action-${id}`}
      className={`rounded-md border border-l-4 border-rule bg-white p-4 sm:p-6 ${
        EDGE[evidence.severity] || 'border-l-steel'
      }`}
    >
      <header className="flex items-start gap-4">
        {position && (
          <span className="font-display text-5xl font-bold leading-none text-steel">
            <span className="sr-only">Priority </span>
            {position}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <SeverityBadge severity={evidence.severity} />
            <span className="text-sm text-steel">
              {KIND_LABEL[evidence.kind] || 'Needs a look'}
            </span>
          </div>

          <h3
            id={`action-${id}`}
            className="mt-2 break-words font-display text-2xl font-semibold leading-tight"
          >
            {title}
          </h3>

          <p className="mt-1 break-words text-sm text-steel">
            {subtitle}
          </p>
        </div>
      </header>

      <p className="mt-4 max-w-prose leading-relaxed">
        {explanation}
      </p>

      {evidence.decision?.unavoidable_gap && (
        <p className="mt-4 rounded-md bg-high-tint p-3 text-sm font-medium text-high">
          No option arrives before stock runs out. This one loses the fewest sales.
        </p>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={`numbers-${id}`}
        onClick={() => setOpen(!open)}
        className="mt-4 min-h-11 text-sm font-semibold text-hydraulic underline underline-offset-4"
      >
        {open ? 'Hide the numbers' : 'Show the numbers'}
      </button>

      {open && (
        <div id={`numbers-${id}`} className="mt-2 space-y-5">
          <EvidenceStrip evidence={evidence} />

          <OptionsCompare options={evidence.options} />

          {evidence.decision?.reason && (
            <details className="text-sm">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold">
                How the agent decided
              </summary>
              <p className="max-w-prose leading-relaxed text-steel">
                {evidence.decision.reason}
              </p>
            </details>
          )}

         
          <DraftSlip type={type} details={details} />
        </div>
      )}

      <DecisionBar id={id} type={type} onDecide={onDecide} />
    </article>
  )
}