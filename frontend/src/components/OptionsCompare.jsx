
import { inr, num, days } from '../lib/format'

function NumericOptions({ options }) {
  const isBest = (o) => o.verdict === 'Recommended'

  return (
    <>
      <table className="mt-2 hidden w-full text-left text-sm md:table">
        <caption className="sr-only">
          Comparison of quantity, cost, delivery time and lost units
        </caption>
        <thead className="text-steel">
          <tr>
            <th className="py-2 pr-3">Option</th>
            <th className="py-2 pr-3">Quantity</th>
            <th className="py-2 pr-3">Cost</th>
            <th className="py-2 pr-3">Arrives in</th>
            <th className="py-2 pr-3">Units lost</th>
            <th className="py-2">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {options.map((o) => (
            <tr
              key={o.id}
              className={`border-t border-rule align-top ${
                isBest(o) ? 'bg-done-tint' : ''
              }`}
            >
              <th scope="row" className="py-3 pr-3 text-left">
                {o.label}
              </th>
              <td className="py-3 pr-3">{num(o.qty, 0)}</td>
              <td className="py-3 pr-3">{inr(o.cost)}</td>
              <td className="py-3 pr-3">{days(o.arrives_in_days)}</td>
              <td className="py-3 pr-3">{num(o.lost_units ?? 0)}</td>
              <td className="py-3">{o.verdict}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="mt-2 space-y-3 md:hidden">
        {options.map((o) => (
          <li
            key={o.id}
            className={`rounded-md border border-rule p-3 ${
              isBest(o) ? 'bg-done-tint' : ''
            }`}
          >
            <p className="font-semibold">{o.label}</p>
            <p className="mt-1 text-sm">
              {num(o.qty, 0)} units for {inr(o.cost)}, arrives in{' '}
              {days(o.arrives_in_days)}, {num(o.lost_units ?? 0)} units lost.
            </p>
            <p className="mt-1 text-sm text-steel">{o.verdict}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function PlainOptions({ options }) {
  return (
    <ul className="mt-2 space-y-3">
      {options.map((o) => (
        <li
          key={o.label}
          className={`rounded-md border border-rule p-3 ${
            o.recommended ? 'bg-done-tint' : ''
          }`}
        >
          <p className="font-semibold">
            {o.label}
            {o.recommended && (
              <span className="ml-2 text-sm text-done">
                Recommended
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-steel">{o.detail}</p>
        </li>
      ))}
    </ul>
  )
}

export default function OptionsCompare({ options = [] }) {
  if (!options.length) return null

  const numeric = options.every(
    (o) => typeof o.cost === 'number',
  )

  return (
    <section aria-label="Options compared">
      <h4 className="font-display text-lg font-semibold">
        Options compared
      </h4>
      {numeric ? (
        <NumericOptions options={options} />
      ) : (
        <PlainOptions options={options} />
      )}
    </section>
  )
}