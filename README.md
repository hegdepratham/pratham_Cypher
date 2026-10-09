# Kaveri Spares Agent

Work in progress. Cypher 2026, Challenge 01: The Spare Parts Desk.

\## Backend Setup



The backend is built with Node.js, Express, and SQLite using `better-sqlite3`.



\### Prerequisites



\* Node.js and npm installed.



\### Installation



Open a terminal in the backend directory:



```powershell

cd backend

npm install

```



\### Environment Configuration



Create a `.env` file inside the `backend` directory using `.env.example` as a reference.



Configure the following variables:



\* `PORT=4000`

\* `FRONTEND\_ORIGIN=http://localhost:5173`

\* `DB\_PATH=` (optional; leave empty to use the default database location)

\* `GROQ\_API\_KEY=` (configure when required by the AI integration)



Do not commit the `.env` file or API keys to Git.



\### Run the Backend



Start the development server:



```powershell

npm run dev

```



The backend runs at `http://localhost:4000` by default.



Check the health endpoint:



```text

http://localhost:4000/api/health

```



\### Available Commands



| Command         | Purpose                                   |

| --------------- | ----------------------------------------- |

| `npm run dev`   | Start the development server with nodemon |

| `npm start`     | Start the server                          |

| `npm run seed`  | Seed the database with demo data          |

| `npm run smoke` | Run backend smoke tests                   |



\### API Endpoints



| Method | Endpoint                   | Purpose                          |

| ------ | -------------------------- | -------------------------------- |

| GET    | `/api/health`              | Check backend health             |

| GET    | `/api/products`            | Retrieve products                |

| GET    | `/api/inventory`           | Retrieve inventory               |

| GET    | `/api/suppliers`           | Retrieve suppliers               |

| GET    | `/api/purchase-orders`     | Retrieve purchase orders         |

| GET    | `/api/sales`               | Retrieve sales data              |

| GET    | `/api/actions`             | List drafted actions             |

| GET    | `/api/actions/:id`         | Retrieve one action              |

| POST   | `/api/actions/:id/approve` | Approve an action                |

| POST   | `/api/actions/:id/reject`  | Reject an action                 |

| POST   | `/api/agent/analyze`       | Analysis endpoint placeholder    |

| POST   | `/api/agent/ask`           | AI question endpoint placeholder |



\*\*Note:\*\* The agent endpoints are placeholders until the analysis and AI integration is completed.



