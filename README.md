# Kaveri Spares Agent

Cypher 2026 · Challenge 01: The Spare Parts Desk.

An agent that reads Kaveri Spares & Hydraulics stock, sales, supplier and purchase-order data every morning, finds the problems that matter today, compares real options with numbers, and drafts a PO or transfer for the Head of Purchasing to approve or reject.

- Live app: https://your-project.vercel.app
- API health: https://your-service.onrender.com/api/health
- Demo video: link

![Dashboard on desktop](docs/screenshots/desktop-1280.png)

## How it works

1. A deterministic engine (plain JavaScript, no AI) observes the data, computes demand rate, days of stock and runway, checks for a transfer from another store first, then compares every supplier on price × lead time × MOQ × cost of lost sales, and picks one. Same data in, same answer out. It is unit-tested.
2. An AI layer (Groq, Llama 3.3 70B) only explains what the engine decided in plain English, and answers questions in the Ask box. Every number the AI writes is checked against the data; if it states a number that is not there, the answer is withheld.

The agent loop: Observe (snapshot.js) → Reason + Evaluate + Decide (detectors/*) → Rank (engine.js) → Act (drafts a pending action) → Explain (explain.js) → a person approves or rejects.

## Run it locally

```bash
git clone https://github.com/<you>/teamname_Cypher.git && cd teamname_Cypher

cd backend
cp .env.example .env
npm install
npm run seed
npm run dev

cd ../frontend
cp .env.example .env
npm install
npm run dev
```

## Environment variables

| Variable | Purpose |
|---|---|
| PORT | API port |
| FRONTEND_ORIGIN | Allowed browser origin(s) |
| DB_PATH | SQLite file path |
| GROQ_API_KEY | Groq key |
| GROQ_MODEL | Model id |
| ADMIN_TOKEN | Secret for reset endpoint |
| VITE_API_URL | backend URL |
| VITE_USE_MOCK | true/false |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | health check |
| GET | /api/products | products |
| GET | /api/inventory | stock |
| GET | /api/sales | sales |
| GET | /api/suppliers | suppliers |
| GET | /api/purchase-orders | purchase orders |
| POST | /api/agent/analyze | run agent |
| GET | /api/actions | action history |
| POST | /api/actions/:id/approve | approve |
| POST | /api/actions/:id/reject | reject |
| POST | /api/agent/ask | grounded question answer |

## Security

Keys only in environment variables, CORS limited, parameterised SQL only, rate limits, security headers, and no automatic execution.

## Team

Backend & data · Agent engine · Frontend · AI & deployment
