
import { TYPE_LABEL } from '../lib/labels'

export default function DecidedList({ items }) {
  if (!items.length) return null

  return (
    <section aria-labelledby="decided-heading" className="mt-12">
      <h2
        id="decided-heading"
        className="font-display text-2xl font-semibold"
      >
        Already decided
      </h2>

      <ul className="mt-3 divide-y divide-rule rounded-md border border-rule bg-white">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 p-4"
          >
            <div className="min-w-0">
              <p className="break-words font-semibold">
                {a.evidence?.product?.name || a.sku}
              </p>

              <p className="text-sm text-steel">
                {TYPE_LABEL[a.type] || 'Action'} for {a.sku}
                {a.evidence?.location
                  ? ` at ${a.evidence.location}`
                  : ''}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                a.status === 'approved'
                  ? 'bg-done-tint text-done'
                  : 'bg-sheet text-steel'
              }`}
            >
              {a.status === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}