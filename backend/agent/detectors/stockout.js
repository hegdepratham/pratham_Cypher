const C = require('../config');
const { round0, round1, inr, cheapestOf, projectRunout, makeFinding } = require('../helpers');

function buildTransferOption({ stock, rate, runway, donors, unitValue }) {
  const stockAtArrival = Math.max(0, stock - rate * C.TRANSFER_DAYS);
  const need = Math.max(1, Math.ceil(rate * C.COVER_DAYS - stockAtArrival));

  const donor = donors
    .map((d) => ({
      ...d,
      surplus: Math.floor(d.stock - d.rate * (C.TRANSFER_DAYS + C.DONOR_KEEP_DAYS)),
    }))
    .filter((d) => d.surplus > 0)
    .sort((a, b) => b.surplus - a.surplus)[0];
  if (!donor) return null;

  const qty = Math.min(donor.surplus, need);
  const inTime = C.TRANSFER_DAYS <= runway;
  const coversDays = (stockAtArrival + qty) / rate;
  const lost = inTime ? 0 : (C.TRANSFER_DAYS - runway) * rate;
  const cost = qty * C.TRANSFER_COST_PER_UNIT;

  return {
    id: `transfer:${donor.location}`,
    type: 'transfer',
    label: `Transfer from ${donor.location}`,
    from: donor.location,
    qty, need, cost,
    arrives_in_days: C.TRANSFER_DAYS,
    arrives_in_time: inTime,
    lost_units: lost,
    excess_units: 0,
    covers_days: coversDays,
    donor_days_left: donor.rate > 0 ? (donor.stock - qty) / donor.rate : null,
    effective_cost: cost + lost * unitValue,
    feasible: inTime && coversDays >= C.MIN_COVER_AFTER_FIX,
  };
}

function buildPoOption(s, { stock, rate, runway, unitValue }) {
  const lead = s.lead_time_days;
  const stockAtArrival = Math.max(0, stock - rate * lead);
  const need = Math.max(1, Math.ceil(rate * C.COVER_DAYS - stockAtArrival));
  const qty = Math.max(need, s.moq);
  const inTime = lead <= runway;
  const lost = inTime ? 0 : (lead - runway) * rate;
  const cost = qty * s.price;

  return {
    id: `po:${s.supplier}`,
    type: 'purchase_order',
    label: `PO to ${s.supplier}`,
    supplier: s.supplier,
    unit_price: s.price,
    moq: s.moq,
    lead_time_days: lead,
    qty, need,
    excess_units: qty - need,
    cost,
    arrives_in_days: lead,
    arrives_in_time: inTime,
    lost_units: lost,
    covers_days: (stockAtArrival + qty) / rate,
    effective_cost: cost + lost * unitValue,
    feasible: inTime,
  };
}

function rejectReason(o, chosen, runway) {
  if (!o.arrives_in_time) {
    return `Arrives in ${o.arrives_in_days}d but stock only lasts ~${round1(runway)}d (${round0(o.lost_units)} units lost)`;
  }
  if (o.type === 'transfer' && !o.feasible) {
    return `Would only give ${round1(o.covers_days)} days of cover`;
  }
  if (o.type === 'purchase_order' && o.excess_units > o.need) {
    return `MOQ ${o.moq} forces ${o.excess_units} extra units (${inr(o.cost)} outlay for ${o.need} needed)`;
  }
  return `${inr(o.effective_cost - chosen.effective_cost)} more expensive than the recommended option`;
}

function publicOption(o, verdict) {
  return {
    id: o.id,
    type: o.type,
    label: o.label,
    qty: o.qty,
    cost: round0(o.cost),
    arrives_in_days: o.arrives_in_days,
    arrives_in_time: o.arrives_in_time,
    lost_units: round1(o.lost_units),
    excess_units: o.excess_units,
    covers_days: round1(o.covers_days),
    effective_cost: round0(o.effective_cost),
    feasible: o.feasible,
    ...(o.unit_price !== undefined && { unit_price: o.unit_price, moq: o.moq }),
    verdict,
  };
}

function evaluateStockout({ sku, location, stock, rate, suppliers = [], donors = [], incoming = [] }) {
  if (!(rate > 0)) return null;

  const daysOfStock = stock / rate;
  const runway = projectRunout(stock, rate, incoming);
  const cheapest = cheapestOf(suppliers);
  const usualLead = cheapest ? cheapest.lead_time_days : C.DEFAULT_LEAD_DAYS;

  if (runway >= usualLead) return null;

  const unitValue = cheapest ? cheapest.price * C.LOST_SALE_MARKUP : 0;
  const options = [];
  const transfer = buildTransferOption({ stock, rate, runway, donors, unitValue });
  if (transfer) options.push(transfer);
  suppliers.forEach((s) => options.push(buildPoOption(s, { stock, rate, runway, unitValue })));

  const baseEvidence = {
    location,
    stock,
    demand_rate: round1(rate),
    days_of_stock: round1(daysOfStock),
    runway_days: round1(runway),
    usual_supplier: cheapest ? cheapest.supplier : null,
    usual_lead_days: usualLead,
    incoming_pos: incoming,
  };
  const key = `stock:${sku}:${location}`;

  if (options.length === 0) {
    const score = 110 - Math.min(runway, 14) * 5;
    return makeFinding({
      kind: 'stockout_risk', severity: 'high', score, type: 'alert', sku, key,
      details: { action: 'find_source', to: location },
      evidence: { ...baseEvidence, options: [], decision: { chosen: null, unavoidable_gap: true, reason: 'No supplier or transfer source on file' } },
      text: `${location} will run out of ${sku} in ~${round1(runway)} days and there is no supplier or transfer source on file. Someone needs to find one.`,
    });
  }

  const feasible = options.filter((o) => o.feasible);
  const pool = feasible.length ? feasible : options;
  const chosen = pool.reduce((best, o) => (o.effective_cost < best.effective_cost ? o : best));
  const unavoidableGap = feasible.length === 0;

  const cheapestOption = cheapest ? options.find((o) => o.id === `po:${cheapest.supplier}`) : null;
  const mismatch =
    chosen.type === 'purchase_order' &&
    cheapestOption &&
    cheapestOption !== chosen &&
    cheapestOption.excess_units > cheapestOption.need;

  const kind = mismatch ? 'supplier_mismatch' : 'stockout_risk';
  const severity = runway <= 3 || unavoidableGap ? 'high' : 'medium';
  const score = 100 - Math.min(runway, 14) * 5 + (unavoidableGap ? 10 : 0);

  let reason;
  if (unavoidableGap) {
    reason = `No option arrives before stock-out (~${round1(runway)}d). ${chosen.label} loses the least (~${round0(chosen.lost_units)} units).`;
  } else if (chosen.type === 'transfer') {
    reason =
      `Arrives in ${chosen.arrives_in_days}d, before stock-out in ~${round1(runway)}d, costs ~${inr(chosen.cost)} ` +
      `and gives ${round1(chosen.covers_days)} days of cover. ${chosen.from} still keeps ~${round1(chosen.donor_days_left)} days of its own stock.`;
  } else {
    reason = `Arrives in ${chosen.arrives_in_days}d, before stock-out in ~${round1(runway)}d; ${chosen.qty} units for ${inr(chosen.cost)}.`;
  }
  if (chosen.type === 'purchase_order' && cheapest && chosen.supplier !== cheapest.supplier) {
    const pct = round1((chosen.unit_price / cheapest.price - 1) * 100);
    reason += ` Unit price is ${pct}% above the usual supplier (${cheapest.supplier}).`;
  }
  if (mismatch) {
    reason += ` ${cheapest.supplier} is cheapest per unit but its MOQ of ${cheapest.moq} would force ${inr(cheapestOption.cost)} of stock for a need of ${cheapestOption.need} units.`;
  }

  const details =
    chosen.type === 'transfer'
      ? { from: chosen.from, to: location, qty: chosen.qty, est_cost: round0(chosen.cost), arrives_in_days: chosen.arrives_in_days }
      : {
          supplier: chosen.supplier,
          qty: chosen.qty,
          unit_price: chosen.unit_price,
          est_cost: round0(chosen.cost),
          lead_time_days: chosen.lead_time_days,
          deliver_to: location,
          price_premium_pct: cheapest ? round1((chosen.unit_price / cheapest.price - 1) * 100) : 0,
        };

  return makeFinding({
    kind, severity, score, type: chosen.type, sku, key, details,
    evidence: {
      ...baseEvidence,
      options: options.map((o) => publicOption(o, o === chosen ? 'Recommended' : rejectReason(o, chosen, runway))),
      decision: { chosen: chosen.label, unavoidable_gap: unavoidableGap, reason },
    },
    text: `${location} has ${stock} units of ${sku} and sells ~${round1(rate)}/day, so it runs out in ~${round1(runway)} days. ${reason}`,
  });
}

module.exports = { evaluateStockout };
