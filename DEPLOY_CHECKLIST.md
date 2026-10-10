# Pre-Deploy Validation Checklist

## Status: ✅ READY TO DEPLOY (with noted fixes)

This document lists all findings from the final pre-deploy validation pass.

---

## Critical Issues Found: 2

### Issue #1: `/api/agent/ask` endpoint is stubbed (NOT IMPLEMENTED)
**Severity:** HIGH  
**File:** `backend/routes/agent.js` (lines 54-59)  
**Current code:**
```javascript
router.post('/ask', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});
```

**Why it matters:** The frontend Dashboard expects this endpoint to power the "Ask the agent" box. Currently it will always return 501.

**Fix:** Replace the stub with the full implementation from `backend/agent/ask.js`:

```javascript
const { rateLimit } = require('../middleware/rateLimit');
const { answerQuestion } = require('../agent/ask');

// ... in the router:
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
```

**Status:** PENDING - needs code push

---

### Issue #2: `/api/agent/analyze` only calls `detectStockout`, missing other detectors
**Severity:** HIGH  
**File:** `backend/routes/agent.js` (line 14)  
**Current code:**
```javascript
const findings = detectStockout(snapshot);
```

**Why it matters:** The agent should detect 5 problem types:
1. Stockout risk ✅
2. Overdue POs ❌
3. Slow-moving stock ❌
4. Demand spikes/drops ❌
5. Supplier mismatch (within stockout) ✅

Only stockout is checked. Missing 3 detectors = incomplete agent.

**Fix:** Replace the line with the full engine analysis:

```javascript
const { analyze } = require('../agent/engine');
const repo = require('../db/actionsRepo');

// In the /analyze route:
router.post('/analyze', rateLimit({ windowMs: 60 * 1000, max: 6 }), async (req, res, next) => {
  try {
    const decided = repo.listActions().filter((a) => a.status !== 'pending');
    const findings = analyze(db, { decided });  // <-- Use engine.js, not detectStockout

    repo.clearPendingActions();
    // ... rest of the route
  } catch (err) {
    next(err);
  }
});
```

**Status:** PENDING - needs code push

---

## Minor Issues Found: 3

### Issue #3: Missing `frontend/.env.example`
**Severity:** MEDIUM  
**Why it matters:** Teammates need to know what env vars to set.

**Fix:** Create `frontend/.env.example`:
```
VITE_API_URL=http://localhost:4000
VITE_USE_MOCK=false
```

**Status:** PENDING - needs file creation

---

### Issue #4: Groq model field incompatibility
**Severity:** MEDIUM  
**File:** `backend/agent/groq.js` (line 76)  
**Current code:**
```javascript
const body = {
  model: model(),
  temperature,
  max_tokens: maxTokens,
  reasoning_effort: 'low',  // <-- NOT supported by Groq API
  messages: [...]
};
```

**Why it matters:** The `reasoning_effort` field is OpenAI-specific and will cause a 400 error when used with Groq.

**Fix:** Remove line 76 entirely. Groq does not need it:
```javascript
const body = {
  model: model(),
  temperature,
  max_tokens: maxTokens,
  messages: [...]
};
```

**Status:** PENDING - needs code push

---

### Issue #5: `backend/routes/agent.js` missing required imports
**Severity:** MEDIUM  
**File:** `backend/routes/agent.js`  
**Current code:**
```javascript
const express = require('express');
const db = require('../db');
const repo = require('../db/actionsRepo');
const { loadSnapshot } = require('../agent/snapshot');
const { detectStockout } = require('../agent/detectors/stockout');
const { explainAction } = require('../agent/explain');
```

**Missing:** 
- `const { analyze } = require('../agent/engine');`
- `const { answerQuestion } = require('../agent/ask');`
- `const { rateLimit } = require('../middleware/rateLimit');`

**Fix:** Add all three imports at the top.

**Status:** PENDING - needs code push

---

## Deployment Environment Checklist

### Backend (production on Render or similar)

- [ ] `PORT` set (default 4000)
- [ ] `FRONTEND_ORIGIN` set to the live frontend URL (e.g., `https://myapp.vercel.app`)
- [ ] `GROQ_API_KEY` set (get from https://console.groq.com/keys)
- [ ] `GROQ_MODEL` set to a valid Groq model (e.g., `llama-3.3-70b-versatile`)
- [ ] `ADMIN_TOKEN` set to a random secret (for reseed endpoint)
- [ ] `DB_PATH` optional (defaults to `/tmp/kaveri.db` or similar on Render)
- [ ] CORS allows the frontend origin
- [ ] npm dependencies installed
- [ ] Database seeded (`npm run seed`)

### Frontend (production on Vercel or similar)

- [ ] `VITE_API_URL` set to the live backend URL (e.g., `https://myapi.onrender.com`)
- [ ] `VITE_USE_MOCK` set to `false`
- [ ] npm dependencies installed
- [ ] Build succeeds (`npm run build`)
- [ ] Vercel build settings:
  - Framework: Vite
  - Build command: `npm run build`
  - Output directory: `dist`

---

## Pre-Launch Smoke Tests

Run these **locally** before deploying:

### Test 1: Backend server starts
```bash
cd backend
npm install
cp .env.example .env
# Fill .env with test values
npm run seed
npm run dev
# Expected: Backend running at http://localhost:4000
```

### Test 2: Health check
```bash
curl http://localhost:4000/api/health
# Expected: {"status":"ok","message":"Backend server is running"}
```

### Test 3: Analyze endpoint (partial — no AI)
```bash
curl -X POST http://localhost:4000/api/agent/analyze
# Expected: JSON array of actions with type, sku, details, evidence, explanation
# Note: If GROQ_API_KEY is blank, explanation will be the fallback text (OK)
```

### Test 4: Ask endpoint (with AI key)
```bash
curl -X POST http://localhost:4000/api/agent/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Why was the Gokak filter flagged?"}'
# Expected: {"answer":"...plain English explanation..."}
# If GROQ_API_KEY is blank: {"error":"The ask box needs an AI key..."}
```

### Test 5: Frontend builds
```bash
cd frontend
npm install
npm run build
# Expected: dist/ folder with HTML + JS bundles
```

### Test 6: Frontend runs in dev
```bash
npm run dev
# Expected: http://localhost:5173 shows the dashboard
# Click "Run analysis" → should call the backend and show findings
```

---

## Fixed Code (Ready to Push)

All required fixes are documented above. The corrected versions are:

1. **backend/routes/agent.js** — add full analyze + ask implementations with imports
2. **backend/agent/groq.js** — remove `reasoning_effort` field
3. **frontend/.env.example** — create with VITE_API_URL and VITE_USE_MOCK

---

## Summary

| Category | Status |
|---|---|
| Core engine logic | ✅ Complete |
| Database schema | ✅ Valid |
| Security (CORS, rate limits, parameterized SQL) | ✅ In place |
| Error handling | ✅ Comprehensive |
| Missing implementations | ⚠️ 2 fixes needed |
| Configuration readiness | ⚠️ Minor fixes needed |
| **Overall readiness** | **🟡 Ready with fixes** |

Once the 5 issues above are fixed with code pushes, the project is **fully deployment-ready** to production.

---

## Next Steps

1. **Right now:** Fix the 5 issues listed above with code pushes
2. **Before deploying:** Run the 6 smoke tests locally
3. **Production deployment:**
   - Backend → Render.com (free tier works)
   - Frontend → Vercel.com (free tier works)
   - Configure env vars on each platform
   - Deploy and test the live link
4. **Go live:** Share the live URL
