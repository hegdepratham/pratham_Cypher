
const express = require('express');
const db = require('../db');
const repo = require('../db/actionsRepo');
const { loadSnapshot } = require('../agent/snapshot');
const { detectStockout } = require('../agent/detectors/stockout');
const { explainAction } = require('../agent/explain');

const router = express.Router();

router.post('/analyze', async (req, res, next) => {
  try {
    const snapshot = loadSnapshot(db);
    const findings = detectStockout(snapshot);

    const pending = repo.listActions('pending');
    const pendingKeys = new Set(
      pending.map((action) => action.evidence?.key).filter(Boolean)
    );

    for (const finding of findings) {
      const key = finding.evidence?.key;

      // Avoid creating duplicate pending suggestions.
      if (key && pendingKeys.has(key)) continue;

      const fallback =
        finding.explanation_fallback || 'Stock risk detected.';

      const action = repo.createAction({
        type: finding.type,
        sku: finding.sku,
        details: finding.details || {},
        evidence: finding.evidence || {},
        explanation: fallback
      });

      if (key) pendingKeys.add(key);

      // Use AI when configured; retain the deterministic fallback otherwise.
      const explanation = await explainAction(action);

      if (explanation) {
        repo.setExplanation(action.id, explanation);
      }
    }

    res.json(repo.listActions('pending'));
  } catch (error) {
    next(error);
  }
});

router.post('/ask', (req, res) => {
  res.status(501).json({
    error: 'Not implemented yet'
  });
});

module.exports = router;