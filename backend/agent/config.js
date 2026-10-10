module.exports = {
  // ---- restocking ----
  COVER_DAYS: 14,
  DEFAULT_LEAD_DAYS: 7,
  // ---- transfers between locations ----
  TRANSFER_DAYS: 1,
  TRANSFER_COST_PER_UNIT: 5,
  DONOR_KEEP_DAYS: 14,
  MIN_COVER_AFTER_FIX: 7,
  // ---- cost of losing sales ----
  LOST_SALE_MARKUP: 1.3,
  // ---- overdue POs ----
  OVERDUE_RISK_COVER_DAYS: 7,
  // ---- demand spikes / drops ----
  MIN_UNITS_FOR_TREND: 10,
  SPIKE_RATIO: 2,
  DROP_RATIO: 0.5,
  // ---- slow-moving stock ----
  SLOW_COVER_DAYS: 120,
  SLOW_KEEP_DAYS: 90,
  SLOW_MIN_VALUE: 10000,
  CLEARANCE_RECOVERY: 0.7,
  // ---- housekeeping ----
  DECIDED_MEMORY_HOURS: 24,
};
