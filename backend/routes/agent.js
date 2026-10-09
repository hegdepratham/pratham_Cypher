const express = require('express');

const router = express.Router();

// Temporary placeholder for the analysis engine.
router.post('/analyze', (req, res) => {
res.json([]); // Returns an array of drafted actions.
});

// Temporary placeholder for the chat functionality.
router.post('/ask', (req, res) => {
res.status(501).json({
error: 'Not implemented yet'
});
});

module.exports = router;
