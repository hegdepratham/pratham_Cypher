const C = require('../config');
const { round1, inr, makeFinding } = require('../helpers');

function detectOverduePO({ po, daysOverdue, networkStock, networkRate, suppliers = [] }) {
  if (daysOverdue <= 0 && po.status !== 'overdue') return null;

  const cover = networkRate > 0 ? networkStock / networkRate : Infinity;
  const alt = suppliers
    .filter((s) => s.supplier !== po.supplier)
    .sort((a, b) => a.lead_time_days - b.lead_time_days)[0] || null;

  const backup = cover <= C.OVERDUE_RISK_COVER_DAYS;
  const severity = cover <= 7 ? 'high' : cover <= 14 ? 'medium' : 'low';
  const base = severity === 'high' ? 80 : severity === 'medium' ? 60 : 35;
  const score = base + Math.min(daysOverdue, 10);
  const coverText = Number.isFinite(cover) ? `${round1(cover)} days` : 'no current demand';

  const options = [
    {
      label: 'Chase supplier only',
      detail: `${po.supplier} still owes ${po.qty} units with no confirmed date. Stock lasts ${coverText}.`,
      recommended: !backup,
    },
  ];
  if (alt) {
    options.push({
      label: `Chase + backup order from ${alt.supplier}`,
      detail: `${alt.supplier} can deliver in ${alt.lead_time_days}d at ${inr(alt.price)}/unit (MOQ ${alt.moq}).`,
      recommended: backup,
    });
  }

  const reason = backup
    ? `Only ${coverText} of stock left, so waiting is risky: chase ${po.supplier} AND place a backup order${alt ? ` with ${alt.supplier}` : ''}.`
    : `Stock lasts ${coverText}, so chasing ${po.supplier} for a firm date is enough for now.`;

  return makeFinding({
    kind: 'overdue_po', severity, score, type: 'alert', sku: po.sku, key: `po:${po.po}`,
    details: {
      action: 'chase_supplier', po: po.po, supplier: po.supplier,
      qty_outstanding: po.qty, days_overdue: daysOverdue, expected_date: po.expected_date,
      backup_supplier: backup && alt ? alt.supplier : null,
    },
    evidence: {
      po: po.po, supplier: po.supplier, qty_outstanding: po.qty, days_overdue: daysOverdue,
      network_stock: networkStock, network_days_of_stock: Number.isFinite(cover) ? round1(cover) : null,
      options, decision: { chosen: backup ? options[options.length - 1].label : options[0].label, reason },
    },
    text: `${po.po} (${po.qty} units from ${po.supplier}) is ${daysOverdue} days overdue. ${reason}`,
  });
}

module.exports = { detectOverduePO };
