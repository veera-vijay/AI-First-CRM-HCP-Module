# AI-First Pharma CRM - HCP Module & Interaction Logger

An enterprise-grade customer relationship management (CRM) dashboard designed for Medical Representatives. It provides a structured form interface alongside an advanced conversational AI Chat assistant driven by FastAPI, LangGraph, and Groq LLMs to log meetings, schedule follow-ups, search records, and analyze feedback sentiment.

## Architecture & Data Flow

```
React (Redux Toolkit) -> FastAPI Gateway -> LangGraph Agent -> Groq LLM -> LangGraph DB Tools -> PostgreSQL
```

---

## Technical Stack

*   **Frontend**: React 19, Vite, Redux Toolkit, React Router, TailwindCSS, React Hook Form, Framer Motion, Lucide Icons.
*   **Backend**: Python 3.10+, FastAPI, SQLAlchemy ORM, Uvicorn.
*   **Database**: PostgreSQL.
*   **AI Orchestration**: LangGraph, LangChain, Groq API (utilizing `gemma2-9b-it` as primary extractor and `llama-3.3-70b-versatile` as intent classifier).

---

## Features

1.  **Dual Logging Interfaces**:
    *   **Structured Form**: Fully validated form with autocomplete selectors for doctors and checkbox selections for products.
    *   **AI Conversational Chat**: Reps type standard conversation logs; the LangGraph extractor classifies intent, resolves parameters, saves records to the database automatically, and provides a side-by-side editable preview panel to tweak and save corrections.
2.  **Five LangGraph Agent Tools**:
    *   `log_interaction_tool`: Saves new interactions, updates products, and spawns follow-up alerts.
    *   `edit_interaction_tool`: Updates the most recent visit log for a doctor.
    *   `search_hcp_tool`: Queries doctor profile metadata.
    *   `view_interaction_history_tool`: Generates historical visit timelines.
    *   `schedule_followup_tool`: Registers action items.
3.  **Active Diagnostics Panel**: Real-time Settings screen displaying the connection status of the PostgreSQL database, LangGraph compilation state, and warning if the Groq key is running in mock fallback mode.
4.  **Automatic DB Seeding**: Spawns an initial user `rep1`/`password123`, 10+ doctors, and 5+ products on first boot to populate the analytics dashboard immediately.
5.  **Bonus AI Features**: Dynamic sentiment calculation (Positive, Neutral, Negative), interaction relationship scoring (0-100), automated duplicate entry checking, and audit logger tracking.

---

## Folder Structure

```
.
├── backend/
│   ├── app/
│   │   ├── graph/         # LangGraph core workflow (State, Nodes, Tools)
│   │   ├── config.py      # Environment configuration validation
│   │   ├── database.py    # Engine session provider & DB seeds
│   │   ├── main.py        # FastAPI routes & controllers
│   │   ├── models.py      # SQLAlchemy DB schemas
│   │   └── schemas.py     # Pydantic validation schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Private route checks, sidebar layouts, toasts
│   │   ├── pages/         # Dashboard, Login, HCP forms, histories, settings
│   │   ├── store/         # Redux Toolkit master configuration & slices
│   │   └── utils/         # Axios wrapper & interceptor injection
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   └── architecture.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Setup & Execution

### 1. Prerequisite Environment Setup
Copy the configuration template:
```bash
cp .env.example .env
```
Open `.env` and fill in your details:
*   `GROQ_API_KEY`: Paste your Groq API Key (generate one at [Groq Console](https://console.groq.com/)). *If left blank, the application will automatically activate mock fallback mode, processing natural text locally to ensure instant offline testability.*

---

### 2. Run via Docker Compose (Recommended)
Compile and launch all containers (Database, Backend API, Frontend React client):
```bash
docker-compose up --build
```
Once initialized, access the portals:
*   **React Frontend Web Portal**: `http://localhost:3000`
*   **FastAPI Interactive OpenAPI docs**: `http://localhost:8000/docs`

---

### 3. Run Manually (Local Development)

#### Running Backend
Ensure you have a local PostgreSQL server running, then:
```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python app/database.py # Pre-creates tables and seeds seed data
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Running Frontend
In another terminal instance:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to start exploring the application.

---

## Demo Credentials

*   **Username**: `rep1`
*   **Password**: `password123`

---

## API Documentation

*   `POST /api/login`: JWT login handler.
*   `GET /api/hcps`: Directory of doctors with optional queries (name, hospital, specialty, status).
*   `GET /api/hcp/{id}`: Detailed metadata lookup.
*   `POST /api/interaction`: Save structured visit log. Checks for same-day duplicates.
*   `PUT /api/interaction/{id}`: Edit a logged visit.
*   `DELETE /api/interaction/{id}`: Remove log entry.
*   `GET /api/interactions`: Fetch global meeting log timeline.
*   `POST /api/chat`: Feed text logs to the LangGraph parsing pipeline.
*   `GET /api/chat/history`: Fetch conversational chat history logs.
*   `POST /api/followup`: Schedule individual doctor follow-up tasks.
*   `GET /api/followups`: Timeline list of pending tasks.
*   `GET /api/status`: System status and key check diagnostics endpoint.
