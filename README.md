# Projects, Meetings, Calendar, Knowledge Base

A unified productivity platform integrating Project Management, Meeting Workflows, Calendar Scheduling, and a centralized Knowledge Base.

---

## Phase 1: Foundation Architecture

This repository contains Phase 1 implementation establishing a decoupled, scalable full-stack architecture:

- **Backend**: Node.js & Express API with PostgreSQL connection pooling (`pg`), JWT authentication utilities, modular middleware, and health-check endpoints.
- **Frontend**: React 18 + Vite with Tailwind CSS v4, modern styling, Axios API client, React Router DOM, and an interactive system status dashboard.
- **Database**: PostgreSQL connection pooling with health monitoring and graceful degradation.

---

## Project Structure

```
"Projects, Meetings, Calendar, Knowledge Base"/
├── backend/                  # Express REST API
│   ├── src/
│   │   ├── config/           # Database & Environment configuration
│   │   ├── controllers/      # Route request handlers
│   │   ├── middleware/       # JWT auth, error handling, 404 handler
│   │   ├── models/           # Data models (for upcoming phases)
│   │   ├── routes/           # Express router definitions
│   │   ├── utils/            # JWT & response helpers
│   │   ├── app.js            # Express application setup
│   │   └── server.js         # HTTP server entry point
│   ├── .env                  # Backend environment variables
│   ├── .env.example          # Environment variables template
│   ├── .gitignore
│   └── package.json
├── frontend/                 # React + Vite client
│   ├── src/
│   │   ├── assets/           # Media & static assets
│   │   ├── components/       # Reusable UI components & layouts
│   │   ├── pages/            # Page views (Dashboard & 404)
│   │   ├── routes/           # React Router DOM configuration
│   │   ├── services/         # Axios API client & services
│   │   ├── App.jsx           # Root application component
│   │   ├── index.css         # Tailwind CSS & design tokens
│   │   └── main.jsx          # React DOM entry point
│   ├── index.html
│   ├── vite.config.js        # Vite + Tailwind v4 configuration
│   ├── .env                  # Frontend environment variables
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
├── .gitignore                # Root Git ignore rules
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended, v24 supported)
- npm (v9+)
- PostgreSQL (optional for initial mock/fallback, required for persistence)

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and adjust database credentials if needed:
   ```bash
   cp .env.example .env
   ```

4. Verify database connection:
   ```bash
   npm run db:test
   ```

5. Start the backend server:
   - Development mode (with nodemon):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

Backend runs at `http://localhost:5000`.
- Health Check: `GET http://localhost:5000/api/health`
- Root Info: `GET http://localhost:5000/`

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

Frontend runs independently at `http://localhost:5173`.
