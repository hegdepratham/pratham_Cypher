# Kaveri Spares Agent

Cypher 2026 · Challenge 01: The Spare Parts Desk.

An agent that reads Kaveri Spares & Hydraulics stock, sales, supplier and purchase-order data every morning, finds the problems that matter today, compares real options with numbers, and drafts a PO or transfer for the Head of Purchasing to approve or reject.

## What is included

- Deterministic agent engine with stockout, demand-change, overdue-PO, and slow-moving detections
- Transfer-before-buy logic with option comparison and rationale
- SQLite-backed backend API and action approval flow
- Groq-powered explanation layer with grounded-number validation
- Ask-the-agent feature using a data pack and guardrails
- Frontend dashboard for viewing scheduled actions and decisions
- Docker and CI setup for deployment preparation

## Run locally

```bash
git clone https://github.com/hegdepratham/pratham_Cypher.git
cd pratham_Cypher

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

Backend (`backend/.env`):
- `PORT=4000`
- `FRONTEND_ORIGIN=http://localhost:5173`
- `DB_PATH=` (optional)
- `GROQ_API_KEY=`
- `GROQ_MODEL=openai/gpt-oss-120b`
- `ADMIN_TOKEN=`

Frontend (`frontend/.env`):
- `VITE_API_URL=http://localhost:4000`
- `VITE_USE_MOCK=false`

## Core endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/inventory`
- `GET /api/sales`
- `GET /api/suppliers`
- `GET /api/purchase-orders`
- `POST /api/agent/analyze`
- `POST /api/agent/ask`
- `GET /api/actions`
- `POST /api/actions/:id/approve`
- `POST /api/actions/:id/reject`

## Deployment note

The app is structured for deployment on Render (backend) and Vercel (frontend), with env vars configured separately and no secrets committed to the repo.
