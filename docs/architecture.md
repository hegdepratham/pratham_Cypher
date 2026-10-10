# Architecture

```mermaid
flowchart LR
  subgraph Browser["Browser · Vercel"]
    UI["React + Tailwind dashboard<br/>approve / reject · ask box"]
  end

  subgraph API["Express API · Render"]
    ROUTES["routes/<br/>data · agent · actions · ops"]
    ENGINE["agent/engine.js<br/>deterministic detectors<br/>(no AI)"]
    AI["agent/explain.js + ask.js<br/>number-grounding guard"]
    DB[("SQLite<br/>products · inventory · sales<br/>suppliers · POs · actions")]
  end

  GROQ["Groq API<br/>Llama 3.3 70B"]

  UI -->|"HTTPS · JSON"| ROUTES
  ROUTES --> ENGINE
  ENGINE --> DB
  ROUTES --> DB
  ROUTES --> AI
  AI -->|"evidence only, never the database"| GROQ
```

## The agent loop mapped to files

| Step | File | What it does |
|---|---|---|
| Observe | `agent/snapshot.js` | Loads stock, sales, suppliers, POs; computes demand rates |
| Reason · Evaluate · Decide | `agent/detectors/*` | Days of stock vs lead time; transfer first, then suppliers |
| Rank | `agent/engine.js` | Scores all findings and ranks them |
| Act | `routes/agent.js` + `db/actionsRepo.js` | Saves each finding as a `pending` action |
| Explain | `agent/explain.js` | Plain-English rationale with checked numbers |
| Ask | `agent/ask.js` | Answers questions from a data pack only |
