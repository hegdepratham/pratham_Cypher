const express = require('express');
const db = require('../db');
const repo = require('../db/actionsRepo');
const { analyze } = require('../agent/engine');
const { explainAction } = require('../agent/explain');
const { answerQuestion } = require('../agent/ask');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/analyze', rateLimit({ windowMs: 60 * 1000, max: 6 }), async (req, res, next) => {
  try {
    const decided = repo.listActions().filter((a) => a.status !== 'pending');
    const findings = analyze(db, { decided });

    repo.clearPendingActions();

    const saved = findings.map((f) =>
      repo.createAction({
        type: f.type,
        sku: f.sku,
        details: f.details,
        evidence: f.evidence,
        explanation: f.explanation_fallback,
      })
    );

    if (typeof explainAction === 'function') {
      const results = await Promise.allSettled(
        saved.map(async (action, i) => {
          const text = await explainAction(action);
          if (text) saved[i] = repo.setExplanation(action.id, text);
        })
      );
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('explain failed:', r.reason && r.reason.message);
      });
    }

    res.json(saved);
  } catch (err) {
    next(err);
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
