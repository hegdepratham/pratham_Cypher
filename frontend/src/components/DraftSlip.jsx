
import { Fragment } from 'react'
import { labelFor, formatDetail } from '../lib/format'

const TITLE = {
  transfer: 'Draft transfer request',
  purchase_order: 'Draft purchase order',
  alert: 'Suggested follow-up',
}

export default function DraftSlip({ type, details = {} }) {
  const rows = Object.entries(details)

  if (!rows.length) return null

  return (
    <section
      aria-label={TITLE[type] || 'Draft'}
      className="mt-5 rounded-md border border-dashed border-steel bg-sheet p-4"
    >
      <h4 className="font-display text-lg font-semibold">
        {TITLE[type] || 'Draft'}
      </h4>

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        {rows.map(([key, value]) => (
          <Fragment key={key}>
            <dt className="text-steel">{labelFor(key)}</dt>
            <dd className="min-w-0 break-words font-medium">
              {formatDetail(key, value)}
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  )
}