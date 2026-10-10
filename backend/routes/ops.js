const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { reseed } = require('../db/seed');
const { isConfigured } = require('../agent/groq');

const router = express.Router();

router.get('/status', (req, res) => {
  try {
    const tables = [
      'products',
      'inventory',
      'sales',
      'suppliers',
      'purchase_orders',
      'actions',
    ];

    const counts = {};

    for (const table of tables) {
      counts[table] = db
        .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
        .get().count;
    }

    res.json({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      version: process.env.RENDER_GIT_COMMIT || 'local',
      ai: {
        configured: isConfigured(),
      },
      counts,
    });
  } catch (error) {
    console.error('Status check failed:', error.message);

    res.status(503).json({
      status: 'error',
      message: 'Database status unavailable',
    });
  }
});

router.post('/admin/reseed', (req, res) => {
  const expected = process.env.ADMIN_TOKEN;
  const provided = req.get('x-admin-token');

  if (!expected || !provided) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  try {
    reseed();

    res.json({
      status: 'ok',
      message: 'Demo database reseeded successfully',
    });
  } catch (error) {
    console.error('Database reseed failed:', error.message);

    res.status(500).json({
      error: 'Database reseed failed',
    });
  }
});

module.exports = router;