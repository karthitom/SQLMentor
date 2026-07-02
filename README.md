# SQLMentor 🔐

> **An AI-Powered SQL Injection Learning & Analysis Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com)

---

> ⚠️ **EDUCATIONAL USE ONLY**
> SQLMentor is strictly designed for cybersecurity education, security awareness training, and authorized testing on **intentionally vulnerable lab environments** that you own or have **explicit written authorization** to test. Do not use this platform against any system without proper authorization. Unauthorized use is illegal and unethical.

---

## What is SQLMentor?

SQLMentor is a production-quality educational cybersecurity platform that helps learners deeply understand SQL injection vulnerabilities through:

- 🔍 **Guided URL Analysis** — Discover input parameters in lab applications
- 📊 **Response Comparison** — Visualize observable behavioral differences
- 🤖 **AI Explanation Engine** — Get plain-English explanations of what you observed and why
- 📚 **Knowledge Base** — Integrated learning articles, quizzes, and practice
- 📄 **Professional Reports** — Generate PDF/HTML/Markdown/JSON learning reports
- 📈 **Progress Tracking** — Track your cybersecurity learning journey

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Python 3.12, FastAPI, Pydantic |
| Database | Firebase Firestore (NoSQL) |
| Storage | Firebase Storage |
| AI | OpenAI-compatible API |
| Auth | Firebase Authentication |
| Deploy | Firebase Hosting (Frontend), Render (Backend) |

---

## Quick Start

### Prerequisites
- Node.js & npm
- Python 3.11+
- Firebase Project (Authentication, Firestore, Storage)
- Render Account (for backend)

### 1. Clone & Configure
```bash
git clone https://github.com/yourorg/sqlmentor.git
cd sqlmentor
```

Create `.env.development` and `.env.production` in both frontend and backend directories.

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Start Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## Project Structure

```
sqlmentor/
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route-level page components
│   │   ├── store/      # Zustand global state
│   │   ├── api/        # API client modules
│   │   ├── hooks/      # Custom React hooks
│   │   └── styles/     # Global CSS, design tokens
│   └── public/
├── backend/            # Python FastAPI backend
│   ├── app/
│   │   ├── api/        # REST API routes (v1)
│   │   ├── core/       # Config, security, database
│   │   ├── models/     # SQLAlchemy ORM models
│   │   ├── schemas/    # Pydantic request/response schemas
│   │   ├── services/   # Business logic services
│   │   └── middleware/ # Security headers, rate limiting
│   └── alembic/        # Database migrations
├── docker/             # Dockerfiles, Nginx config
├── docs/               # Architecture, API, user docs
└── .github/workflows/  # CI/CD pipelines
```

---

## Documentation

- [Architecture](docs/architecture.md)
- [Installation Guide](docs/installation.md)
- [Developer Guide](docs/developer-guide.md)
- [API Reference](docs/api.md)
- [Database Schema](docs/database-schema.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Security Model](docs/security.md)
- [User Manual](docs/user-manual.md)

---

## Security

SQLMentor itself is built with security-first principles:
- JWT stored in HttpOnly + Secure + SameSite cookies (not localStorage)
- Argon2 password hashing
- CSRF protection on all state-changing endpoints
- Strict CSP, HSTS, X-Frame-Options headers
- Parameterized queries throughout (ORM)
- RBAC with least-privilege enforcement
- Rate limiting on all API endpoints
- Full audit logging

See [Security Documentation](docs/security.md) for details.

---

## License

MIT License — See [LICENSE](LICENSE)

---

## Disclaimer

This platform is provided for **educational and authorized security testing purposes only**. The authors assume no liability for any misuse. Always obtain proper written authorization before testing any system.
