const { loadSnapshot } = require('./snapshot');
const { detectStockout } = require('./detectors/stockout');
const repo = require('../db/actionsRepo');
const { explainAction } = require('./explain');

function analyze(db, options = {}) {
  const snapshot = loadSnapshot(db);
  const findings = detectStockout(snapshot);

  const decided = options.decided || repo.listActions().filter((a) => a.status !== 'pending');
  const decidedKeys = new Set(
    decided
      .map((a) => a.evidence && a.evidence.key)
      .filter(Boolean)
  );

  return findings.filter((finding) => {
    const key = finding && finding.evidence && finding.evidence.key;
    return key ? !decidedKeys.has(key) : true;
  });
}

async function runAnalysis(db) {
  const findings = analyze(db);
  repo.clearPendingActions();

  const created = [];
  for (const finding of findings) {
    const key = finding && finding.evidence && finding.evidence.key;
    if (!finding || !finding.type || !finding.sku) continue;

    const action = repo.createAction({
      type: finding.type,
      sku: finding.sku,
      details: finding.details || {},
      evidence: finding.evidence || {},
      explanation: finding.explanation_fallback || 'Issue detected.'
    });

    created.push(action);

    const explanation = await explainAction(action);
    if (explanation) {
      repo.setExplanation(action.id, explanation);
    }
  }

  return repo.listActions('pending');
}

module.exports = { analyze, runAnalysis };
