# Projects, Meetings, Calendar, Knowledge Base (PMCKB)

> A modern, full-stack Workspace OS integrating **Projects Management**, **Tasks & Deliverables**, **Team Assignments**, **Collaborative Discussions**, **Calendar Milestones**, and an engineering **Knowledge Base**.

---

## 📑 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Database Architecture & Setup](#database-architecture--setup)
6. [Environment Variables](#environment-variables)
7. [Installation & Setup](#installation--setup)
8. [Running the Application](#running-the-application)
9. [Comprehensive API Reference](#comprehensive-api-reference)
10. [Manual Testing & Verification Checklist](#manual-testing--verification-checklist)

---

## Project Overview

**PMCKB** is an internship-grade full-stack workspace operating system designed to streamline team coordination. It provides multi-tenant project management, task breakdown with priority and deadline tracking, team member assignment dispatch, chat-style deliverable discussion threads, and an executive dashboard summarizing delivery velocity and overdue bottlenecks.

---

## Key Features

### 1. Authentication & Security (Phase 2)
- Secure user registration and login with email regex and length validation.
- Passwords salted and hashed with **bcryptjs** (cost factor 10).
- Stateless **JWT (JSON Web Token)** authorization attached via `Authorization: Bearer <token>`.
- Client-side session persistence in `localStorage` with automatic token verification on app mount.
- Protected route wrapper guarding sensitive workspace pages and redirecting guests to login.

### 2. Projects Management (Phase 3)
- Complete CRUD operations for projects (`planning`, `in_progress`, `completed`, `on_hold`).
- Strict owner-scoped isolation (`owner_id = req.user.id`): users cannot view, edit, or delete another user's projects.
- Live search filtering and status classification tabs.

### 3. Tasks Management (Phase 4)
- Granular task breakdown linked to projects (`project_id REFERENCES projects(id) ON DELETE CASCADE`).
- 3 Task Statuses: `todo`, `in_progress`, `completed` with 1-click status advancement.
- 4 Priority Levels: `low`, `medium`, `high`, `urgent` with distinct visual badges.
- Deadline management with automatic overdue detection (`due_date < now && status !== 'completed'`).

### 4. Task Assignments (Phase 5)
- User directory API (`GET /api/users`) returning registered team members (omitting password hashes).
- Reusable `AssigneeSelector` with user avatar initials, display names, and explicit "Unassigned" options.
- 1-click quick-reassign popover directly on task cards.
- Server-side validation ensuring assignees exist in PostgreSQL.

### 5. Task Comments & Discussions (Phase 6)
- Chat-style chronological discussion thread on each task.
- Author-isolated modification: users can **only edit or delete their own comments** (`403 Forbidden` enforced otherwise).
- Formatted timestamps (`MMM d, yyyy h:mm a`) with dynamic `(edited)` indicators.
- Quick comment composer with `Ctrl+Enter` / `Cmd+Enter` keyboard shortcut.

### 6. Final Dashboard & Responsive Navigation (Phase 7)
- **5 Summary Metric Cards**: Total Projects, Total Tasks, In Progress, Completed (with % rate), and Overdue.
- **Project Showcase Cards**: Projects with dynamic task completion progress bars (`X / Y tasks completed, Z%`).
- **Dedicated Overdue Section**: High-priority alert banner listing overdue tasks with instant "Mark Done" resolution.
- **Recent Deliverables Feed**: Multi-dimensional filtering by Search query, Status, Priority, and Assignee.
- **Responsive Navigation**: Desktop sidebar + mobile slide-out drawer with backdrop blur.
- **Integrated Module Previews**: Dedicated interactive pages for **Meetings**, **Calendar**, and **Knowledge Base**.

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend** | Node.js & Express | RESTful API server with modular controllers and routers |
| **Database** | PostgreSQL (Neon Serverless) | Relational database with foreign key cascades and indexes |
| **Database Client** | `pg` (node-postgres) | Connection pooling with SSL configuration |
| **Security** | `bcryptjs` & `jsonwebtoken` | Password hashing and JWT bearer authentication |
| **Frontend** | React 18 + Vite | Single-page application with hot module replacement |
| **Styling** | Tailwind CSS v4 | Modern glassmorphism UI, radial gradients, and responsive layout |
| **Icons** | Lucide React | High-clarity SVG icon library |
| **HTTP Client** | Axios | Configured with automatic JWT injection interceptors |
| **Routing** | React Router DOM v6 | Client-side routing with guarded protected routes |

---

## Folder Structure

```
"Projects, Meetings, Calendar, Knowledge Base"/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # PostgreSQL pool & query wrapper
│   │   │   ├── env.js             # Environment variables validation
│   │   │   └── initDb.js          # PostgreSQL DDL table schemas & migrations
│   │   ├── controllers/
│   │   │   ├── auth.controller.js     # Register, login, profile endpoints
│   │   │   ├── project.controller.js  # Project CRUD endpoints
│   │   │   ├── task.controller.js     # Task CRUD & assignment endpoints
│   │   │   ├── user.controller.js     # User directory endpoints
│   │   │   └── comment.controller.js  # Discussion thread endpoints
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # JWT Bearer token authentication
│   │   │   ├── error.middleware.js    # Centralized JSON error handler
│   │   │   └── notFound.middleware.js # 404 handler
│   │   ├── models/
│   │   │   ├── user.model.js          # User SQL queries
│   │   │   ├── project.model.js       # Project SQL queries
│   │   │   ├── task.model.js          # Task SQL queries with joins
│   │   │   ├── comment.model.js       # Comment SQL queries
│   │   │   └── index.js               # Models index
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # /api/auth
│   │   │   ├── project.routes.js      # /api/projects
│   │   │   ├── task.routes.js         # /api/tasks
│   │   │   ├── user.routes.js         # /api/users
│   │   │   ├── comment.routes.js      # /api/comments
│   │   │   ├── health.routes.js       # /api/health
│   │   │   ├── protected.routes.js    # /api/protected
│   │   │   └── index.js               # Router index
│   │   ├── utils/
│   │   │   ├── jwt.js                 # JWT sign and verify helpers
│   │   │   └── response.js            # Unified JSON response formatter
│   │   ├── app.js                     # Express app configuration & CORS
│   │   └── server.js                  # Server bootstrap entry point
│   ├── .env                           # Backend environment variables (ignored by Git)
│   ├── .env.example                   # Environment template
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/                    # Static assets
│   │   ├── components/
│   │   │   ├── common/                # StatusBadge, ProtectedRoute
│   │   │   ├── layout/                # Navbar, Sidebar (responsive drawer)
│   │   │   ├── projects/              # ProjectModal, DeleteConfirmModal, StatusPill
│   │   │   └── tasks/                 # TaskCard, TaskModal, TaskDetailsModal, AssigneeSelector, PriorityBadge, TaskStatusPill, DeleteTaskModal
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # User state, JWT storage, login, register, logout
│   │   ├── pages/
│   │   │   ├── HomePage.jsx           # Landing overview & system health
│   │   │   ├── LoginPage.jsx          # User sign-in
│   │   │   ├── RegisterPage.jsx       # User registration
│   │   │   ├── DashboardPage.jsx      # 5 summary cards, project progress, overdue alerts, recent tasks
│   │   │   ├── ProjectsPage.jsx       # Full projects board & management
│   │   │   ├── ProjectDetailsPage.jsx # Project task board with assignment controls
│   │   │   ├── TasksPage.jsx          # Cross-project deliverables tracker
│   │   │   ├── MeetingsPage.jsx       # Collaborative meetings preview
│   │   │   ├── CalendarPage.jsx       # Unified milestone calendar
│   │   │   ├── KnowledgePage.jsx      # Documentation & wiki
│   │   │   └── NotFoundPage.jsx       # 404 page
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx          # Route hierarchy with Sidebar integration
│   │   ├── services/
│   │   │   ├── api.js                 # Axios instance with Bearer interceptor
│   │   │   ├── authService.js         # Auth API requests
│   │   │   ├── projectService.js      # Project API requests
│   │   │   ├── taskService.js         # Task API requests
│   │   │   ├── userService.js         # User directory API requests
│   │   │   └── commentService.js      # Task comments API requests
│   │   ├── App.jsx                    # Root app component
│   │   ├── index.css                  # Tailwind CSS v4 & custom design tokens
│   │   └── main.jsx                   # React DOM entry
│   ├── index.html
│   ├── vite.config.js                 # Vite + Tailwind plugin config
│   ├── .env                           # Frontend environment variables (ignored by Git)
│   ├── .env.example                   # Frontend environment template
│   ├── .gitignore
│   └── package.json
│
├── .gitignore                         # Root gitignore (node_modules, .env, scratch, dist)
└── README.md                          # Comprehensive documentation
```

---

## Database Architecture & Setup

The database schema is hosted on PostgreSQL (configured for Neon serverless with SSL support).

```sql
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Projects Table (owner-scoped)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'planning',
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

-- 3. Tasks Table (project-linked & assignable)
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- 4. Task Comments Table (author-protected discussion thread)
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
```

### Running Database Migrations
To initialize or update the PostgreSQL database tables and indexes automatically:
```bash
cd backend
npm run db:init
```

---

## Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5174

# Neon PostgreSQL Connection URL
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=super_secret_jwt_key_phase1_change_in_production
JWT_EXPIRES_IN=7d
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:5000
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm (v9+)
- Active PostgreSQL database connection (e.g. Neon)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Projects, Meetings, Calendar, Knowledge Base"
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Neon PostgreSQL connection string and JWT secret
npm run db:init
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```

---

## Running the Application

### Start the Backend
```bash
cd backend
npm run dev
```
*The Express API will start on `http://localhost:5000`.*

### Start the Frontend
```bash
cd frontend
npm run dev
```
*The Vite development server will start on `http://localhost:5174` (or `http://localhost:5173`).*

### Production Build
```bash
cd frontend
npm run build
```

---

## Comprehensive API Reference

All protected endpoints require the HTTP header:  
`Authorization: Bearer <token>`

### 1. Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user with `{ name, email, password }` |
| `POST` | `/api/auth/login` | Public | Authenticate user, returns JWT and user profile |
| `GET` | `/api/auth/me` | Protected | Returns profile of currently authenticated user |
| `GET` | `/api/protected/test` | Protected | Verification test endpoint for Bearer token validation |

### 2. User Directory
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Protected | Returns list of registered users for assignment dropdowns |

### 3. Projects Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/projects` | Protected | List all projects owned by authenticated user |
| `POST` | `/api/projects` | Protected | Create project `{ name, description, status }` |
| `GET` | `/api/projects/:id` | Protected | Retrieve specific project by ID (owner check enforced) |
| `PUT` | `/api/projects/:id` | Protected | Update project details (owner check enforced) |
| `DELETE` | `/api/projects/:id` | Protected | Delete project (cascades tasks and comments) |

### 4. Tasks Management & Assignments
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | Protected | List all tasks across projects owned by authenticated user |
| `GET` | `/api/tasks/project/:projectId` | Protected | List all tasks for a specific project with assignee details |
| `POST` | `/api/tasks` | Protected | Create new task `{ project_id, title, description, status, priority, due_date, assigned_to }` |
| `GET` | `/api/tasks/:id` | Protected | Get task by ID with joined assignee metadata |
| `PUT` | `/api/tasks/:id` | Protected | Update task fields (owner check enforced) |
| `PATCH` | `/api/tasks/:id/assign` | Protected | Assign/reassign/unassign task `{ assigned_to: userId \| null }` |
| `DELETE` | `/api/tasks/:id` | Protected | Delete task (cascades comments) |

### 5. Task Comments & Discussions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tasks/:taskId/comments` | Protected | Retrieve discussion comments for task ordered chronologically |
| `POST` | `/api/tasks/:taskId/comments` | Protected | Post new comment `{ comment }` under authenticated user |
| `PUT` | `/api/comments/:id` | Protected | Edit comment (strictly author-only, 403 otherwise) |
| `DELETE` | `/api/comments/:id` | Protected | Delete comment (strictly author-only, 403 otherwise) |

### 6. System Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System status, environment, uptime, and database connection state |

---

## Manual Testing & Verification Checklist

### 1. Authentication
- [x] Register new account (validates name, email regex, min 6 char password).
- [x] Reject duplicate email with HTTP 409.
- [x] Login successfully; verify JWT token stored in `localStorage`.
- [x] Refresh page; confirm session persists without re-prompting.
- [x] Logout; verify redirect to login page and token purge.

### 2. Projects Management
- [x] Create multiple projects with different statuses (`planning`, `in_progress`, `completed`).
- [x] Edit project details; verify instant UI update.
- [x] Delete project; verify removal from project lists and dashboard cards.
- [x] Verify multi-tenant isolation: User A cannot view or edit User B's projects.

### 3. Tasks Management & Deliverables
- [x] Create task with title, priority (`urgent`, `high`, `medium`, `low`), status, and target deadline.
- [x] Verify tasks without deadlines display "No deadline".
- [x] Verify overdue tasks display pulsing red "Overdue" badges.
- [x] Cycle task status inline (`todo` -> `in_progress` -> `completed`).

### 4. Team Assignments
- [x] Open task modal; select an assignee from the registered users dropdown.
- [x] Verify task card renders the assignee initials avatar and name.
- [x] Use 1-click reassignment popover on task card to switch assignees.
- [x] Select "Unassigned"; confirm task updates cleanly to `assigned_to: null`.

### 5. Discussion Threads & Comments
- [x] Click task title or discussion button to open `TaskDetailsModal`.
- [x] Post a comment; verify it appears in chronological order with user initials, name, and timestamp.
- [x] Edit comment; verify updated text renders with `(edited)` indicator.
- [x] Verify security: Non-authors cannot edit or delete someone else's comment (HTTP 403).
- [x] Delete comment; verify removal from the discussion thread.

### 6. Executive Dashboard & Responsive Layout
- [x] Inspect 5 summary cards: Total Projects, Total Tasks, In Progress, Completed, Overdue.
- [x] Review project progress cards with live task completion percentages.
- [x] Filter recent tasks by search query, status, priority, and assignee.
- [x] Click the top-left hamburger menu to open the responsive Sidebar navigation drawer.
- [x] Navigate seamlessly between Dashboard, Projects, Tasks, Meetings, Calendar, and Knowledge Base with 0 broken links.

---

## 📜 License
MIT License • Built for Internship Showcase & Full-Stack Portfolio.
