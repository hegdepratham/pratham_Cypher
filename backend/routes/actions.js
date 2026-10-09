const express = require('express');
const repo = require('../db/actionsRepo');

const router = express.Router();

// Get all actions, optionally filtered by status.
router.get('/', (req, res, next) => {
  try {
    const { status } = req.query;
    const actions = repo.listActions(status);
    res.json(actions);
  } catch (error) {
    next(error);
  }
});

// Get one action by ID.
router.get('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid action ID' });
    }

    const action = repo.getAction(id);

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    res.json(action);
  } catch (error) {
    next(error);
  }
});

// Approve an action.
router.post('/:id/approve', (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid action ID' });
    }

    const action = repo.getAction(id);

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    if (action.status !== 'pending') {
      return res.status(409).json({
        error: `Cannot approve an action with status '${action.status}'`
      });
    }

    const updated = repo.setStatus(id, 'approved');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Reject an action.
router.post('/:id/reject', (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid action ID' });
    }

    const action = repo.getAction(id);

    if (!action) {
      return res.status(404).json({ error: 'Action not found' });
    }

    if (action.status !== 'pending') {
      return res.status(409).json({
        error: `Cannot reject an action with status '${action.status}'`
      });
    }

    const updated = repo.setStatus(id, 'rejected');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;