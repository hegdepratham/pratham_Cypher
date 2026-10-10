
import { formatDetail, labelFor } from '../lib/format'

export default function EvidenceStrip({ evidence }) {
  if (!evidence) return null

  const details = Object.entries(evidence).filter(
    ([key, value]) =>
      !['rank', 'severity', 'reason', 'confidence'].includes(key) &&
      value !== null &&
      value !== undefined,
  )

  if (details.length === 0) return null

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {details.map(([key, value]) => (
        <div key={key} className="rounded-md bg-sheet p-3">
          <p className="text-sm text-steel">{labelFor(key)}</p>
          <p className="mt-1 font-semibold text-ink">
            {formatDetail(key, value)}
          </p>
        </div>
      ))}
    </div>
  )
}