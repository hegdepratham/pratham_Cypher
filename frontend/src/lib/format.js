export const inr = (n) =>
  '₹' + Math.round(n).toLocaleString('en-IN')

export const num = (n, digits = 1) =>
  Number(n).toLocaleString('en-IN', {
    maximumFractionDigits: digits,
  })

export const days = (n) =>
  `${num(n)} ${Number(n) === 1 ? 'day' : 'days'}`

export const humanize = (key) =>
  key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

const LABELS = {
  po: 'PO number',
  qty: 'Quantity',
  est_cost: 'Estimated cost',
  unit_price: 'Price per unit',
  qty_outstanding: 'Quantity still owed',
  price_premium_pct: 'Price above usual supplier',
  est_cash_freed: 'Estimated cash freed',
}

export const labelFor = (key) => LABELS[key] || humanize(key)

export function formatDetail(key, value) {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  if (typeof value === 'number') {
    if (/pct/.test(key)) return `${num(value)}%`
    if (/cost|price|value|cash/.test(key)) return inr(value)
    if (/days/.test(key)) return days(value)
    return num(value)
  }

  if (/^[a-z]+(_[a-z]+)+$/.test(String(value))) {
    return humanize(String(value))
  }

  return String(value)
}