const express = require('express');
const db = require('../db');
const repo = require('../db/actionsRepo');
const { runAnalysis } = require('../agent/engine');
const { explainAction } = require('../agent/explain');
const { answerQuestion } = require('../agent/ask');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/analyze', rateLimit({ windowMs: 60 * 1000, max: 6 }), async (req, res, next) => {
  try {
    const pendingBefore = repo.listActions('pending');
    const pendingKeys = new Set(pendingBefore.map((a) => a.evidence && a.evidence.key).filter(Boolean));

    const findings = require('../agent/engine').analyze(db);
    const fresh = [];

    for (const finding of findings) {
      const key = finding && finding.evidence && finding.evidence.key;
      if (key && pendingKeys.has(key)) continue;

      const action = repo.createAction({
        type: finding.type,
        sku: finding.sku,
        details: finding.details || {},
        evidence: finding.evidence || {},
        explanation: finding.explanation_fallback || 'Issue detected.'
      });

      const explanation = await explainAction(action);
      if (explanation) repo.setExplanation(action.id, explanation);
      fresh.push(action);
      if (key) pendingKeys.add(key);
    }

    res.json(repo.listActions('pending'));
  } catch (error) {
    next(error);
  }
});

router.post('/ask', rateLimit({ windowMs: 60 * 1000, max: 15 }), async (req, res) => {
  const q = req.body && typeof req.body.question === 'string' ? req.body.question.trim() : '';
  if (!q) return res.status(400).json({ error: 'question is required' });
  if (q.length > 300) return res.status(400).json({ error: 'question must be 300 characters or fewer' });

  try {
    const answer = await answerQuestion(q);
    res.json({ answer });
  } catch (err) {
    if (err && err.code === 'NO_KEY') {
      return res.status(503).json({ error: 'The ask box needs an AI key and none is set on the server.' });
    }
    console.error('ask failed:', err && err.status, err && err.message);
    res.status(502).json({ error: 'The AI service did not answer. Please try again in a moment.' });
  }
});

module.exports = router;
