const C = require('../config');
const { round0, round1, inr, cheapestOf, projectRunout, makeFinding } = require('../helpers');

function detectDemandChange({ sku, location, last7, prev7, stock, incoming = [], suppliers = [] }) {
  const spike = last7 >= C.MIN_UNITS_FOR_TREND && last7 >= C.SPIKE_RATIO * prev7;
  const drop = prev7 >= C.MIN_UNITS_FOR_TREND && last7 <= C.DROP_RATIO * prev7;
  if (!spike && !drop) return null;

  const rate = last7 / 7;
  const prevRate = prev7 / 7;
  const ratio = prev7 > 0 ? last7 / prev7 : null;
  const cheapest = cheapestOf(suppliers);
  const usualLead = cheapest ? cheapest.lead_time_days : C.DEFAULT_LEAD_DAYS;
  const runway = projectRunout(stock, rate, incoming);
  const key = `demand:${sku}:${location}`;
  const base = {
    location, stock,
    demand_rate: round1(rate), previous_rate: round1(prevRate),
    change_ratio: ratio === null ? null : round1(ratio),
    runway_days: Number.isFinite(runway) ? round1(runway) : null,
    usual_lead_days: usualLead, incoming_pos: incoming,
  };

  if (spike) {
    const incomingTotal = incoming.reduce((s, p) => s + p.qty, 0);
    const wanted = Math.max(0, Math.ceil(rate * (usualLead + C.COVER_DAYS) - stock - incomingTotal));
    const qty = wanted > 0 ? Math.max(wanted, cheapest ? cheapest.moq : 0) : 0;
    const orderByDays = runway - usualLead;
    const orderNow = qty > 0 && orderByDays <= 1;
    const severity = runway < usualLead ? 'high' : 'medium';
    const score = 50 + Math.min((ratio === null ? 5 : ratio) * 5, 25) + (severity === 'high' ? 15 : 0);

    const options = [
      {
        label: 'Reorder now',
        detail: qty > 0 && cheapest
          ? `${qty} units from ${cheapest.supplier} (${inr(qty * cheapest.price)}, ${usualLead}d lead time).`
          : 'Stock and open POs already cover the new demand.',
        recommended: orderNow,
      },
      {
        label: 'Watch and reorder later',
        detail: Number.isFinite(orderByDays)
          ? `Safe to wait ~${round1(Math.max(0, orderByDays))} more days before ordering.`
          : 'No stock-out in sight.',
        recommended: !orderNow,
      },
    ];
    const reason = orderNow
      ? `At the new rate we run out in ~${round1(runway)}d and the supplier needs ${usualLead}d, so order now.`
      : `At the new rate we run out in ~${round1(runway)}d; the supplier needs ${usualLead}d, so the latest safe order date is in ~${round1(Math.max(0, orderByDays))} days. Review the reorder quantity then.`;

    return makeFinding({
      kind: 'demand_change', severity, score, type: 'alert', sku, key,
      details: {
        action: 'review_reorder', direction: 'up', suggested_reorder_qty: qty,
        supplier: cheapest ? cheapest.supplier : null,
        order_by_days: Number.isFinite(orderByDays) ? round1(Math.max(0, orderByDays)) : null,
      },
      evidence: { ...base, options, decision: { chosen: orderNow ? options[0].label : options[1].label, reason } },
      text: `Sales of ${sku} at ${location} jumped ${round1(ratio || 0)}x (${round1(prevRate)} → ${round1(rate)}/day). ${reason}`,
    });
  }

  const weeksLeft = rate > 0 ? stock / rate / 7 : null;
  const options = [
    { label: 'Keep reordering as usual', detail: `Risk: ${stock} units may sit for ${weeksLeft === null ? 'a long time' : round0(weeksLeft) + ' weeks'}.`, recommended: false },
    { label: 'Pause reorders and investigate', detail: 'Check for a price, quality or competitor problem before buying more.', recommended: true },
  ];
  return makeFinding({
    kind: 'demand_change', severity: 'low', score: 40, type: 'alert', sku, key,
    details: { action: 'review_drop', direction: 'down' },
    evidence: { ...base, options, decision: { chosen: options[1].label, reason: 'Demand halved; buying more now would add to excess stock.' } },
    text: `Sales of ${sku} at ${location} fell from ${round1(prevRate)} to ${round1(rate)}/day. Pause reorders until the cause is understood.`,
  });
}

module.exports = { detectDemandChange };
