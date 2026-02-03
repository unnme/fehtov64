# Organization Management System

Full-stack application for managing organization: news, documents, employees, positions, organization card.

## Architecture Overview

The application consists of two parts:

### Public Website (`example.com`)
Public-facing site accessible without authentication:
- `/` - Landing page with news feed
- `/news` - All news articles
- `/news/:id` - Individual news article
- `/docs/*` - Public documents (rules, education, organizational, financial, legal)
- `/about` - About the organization
- `/federation` - Federation information
- `/contacts` - Contact information with map

### Authentication (`example.com/auth/*`)
- `/auth/login` - User login
- `/auth/signup` - User registration
- `/auth/recover-password` - Password recovery request
- `/auth/reset-password` - Password reset (via email link)

### Admin Dashboard (`dashboard.example.com`)
Protected admin panel requiring authentication:
- `/dashboard` - Overview
- `/manage-news` - Create/edit/delete news
- `/documents` - Document management
- `/persons` - Employee management
- `/positions` - Position management
- `/users` - User administration
- `/organization-card` - Organization settings (phones, email, work hours, messengers)

---

## Tech Stack

### Backend
| Library | Purpose |
|---------|---------|
| FastAPI | Web framework with auto-generated OpenAPI |
| SQLModel | ORM (SQLAlchemy + Pydantic) |
| PostgreSQL | Database |
| Alembic | Database migrations |
| Pydantic | Data validation and settings |
| PyJWT | JWT authentication |
| Passlib + bcrypt | Password hashing |
| Pillow | Image processing |
| aiofiles | Async file operations |
| SlowAPI | Rate limiting |
| fastapi-mail | Email sending |
| Sentry SDK | Error tracking |

### Frontend
| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite 7 | Build tool and dev server |
| TailwindCSS 4 | Utility-first CSS |
| TanStack Router | File-based routing |
| TanStack React Query | Server state management, caching |
| TanStack React Table | Data tables with sorting, filtering |
| React Hook Form | Form state management |
| Zod 4 | Schema validation |
| Radix UI + shadcn/ui | Accessible UI components |
| Tiptap | Rich text editor (WYSIWYG) |
| dnd-kit | Drag and drop |
| Lucide React | Icons |
| date-fns | Date formatting |
| react-dropzone | File upload |
| react-phone-number-input | Phone number input |
| Sonner | Toast notifications |
| next-themes | Dark/light mode |
| Axios | HTTP client |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Traefik | Reverse proxy, SSL termination |
| Let's Encrypt | Free SSL certificates (staging/production) |
| PostgreSQL Backup | Automated database backups |
| Mailcatcher | Email testing (dev only) |

### Dev Tools
| Tool | Purpose |
|------|---------|
| @hey-api/openapi-ts | Auto-generate TypeScript API client from OpenAPI |
| ESLint | Frontend linting |
| Ruff | Backend linting and formatting |
| Mypy | Python type checking |
| uv | Fast Python package manager |

---

## Quick Start

### Development (Docker)

```bash
cp .env.example .env
# Edit .env with your values

docker compose up -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Hot Reload:** Use `docker compose watch` instead of `up -d` for automatic file sync and container rebuilds on changes.

### Staging

Staging runs on a real server with HTTPS, just like production.

```bash
cp .env.staging.example .env.staging
# Edit .env.staging with your staging domain and credentials

./scripts/start-staging.sh
```

Required DNS records for `staging.example.com`:
- `staging.example.com` → server IP
- `api.staging.example.com` → server IP
- `dashboard.staging.example.com` → server IP
- `traefik.staging.example.com` → server IP

### Production

```bash
cp .env.production.example .env.production
# Edit .env.production with real values

./scripts/start-production.sh
```

---

## Backend

### Local Development (without Docker)

```bash
cd backend
uv sync
fastapi dev app/main.py
```

Requires PostgreSQL on localhost:5432 (or Docker DB with exposed port).

### Commands

```bash
uv sync                                       # Install dependencies
fastapi dev app/main.py                       # Dev server with hot reload
alembic upgrade head                          # Run migrations
alembic revision --autogenerate -m "message"  # Create migration
mypy app                                      # Type checking
ruff check app scripts                        # Linting
ruff format app scripts                       # Formatting
```

### Project Structure

```
backend/
├── app/
│   ├── api/routes/      # API endpoints
│   ├── core/            # Config, security, errors
│   │   ├── security/    # Auth, IP blocking, rate limiting
│   │   └── errors/      # Error codes and exceptions
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── repositories/    # Data access layer
│   ├── models.py        # SQLModel models
│   └── main.py          # Entry point
├── scripts/             # Utility scripts
└── alembic/             # Database migrations
```

### Environment Variables

Variables come from multiple sources (highest priority first):

1. `environment:` in docker-compose.yml
2. `env_file:` in docker-compose.yml
3. `.env` file
4. System environment

**Example:** `POSTGRES_SERVER`

| Run Method | .env | docker-compose | Result |
|------------|------|----------------|--------|
| `docker compose up` | localhost | `POSTGRES_SERVER=db` | **db** |
| `fastapi dev` | localhost | — | **localhost** |

### Frontend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_YANDEX_MAPS_API_KEY` | No | Yandex Maps API key for contacts page map |

---

## Frontend

### Local Development (without Docker)

```bash
cd frontend
npm install
npm run dev
```

### Commands

```bash
npm install              # Install dependencies
npm run dev              # Dev server (localhost:5173)
npm run build            # TypeScript check + Vite build
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run generate-client  # Regenerate OpenAPI client (requires running backend)
```

### Project Structure

```
frontend/src/
├── routes/              # File-based routing (_layout/ = protected)
├── components/          # By feature: Users, News, Documents, Persons, etc.
│   ├── Common/          # Reusable components
│   ├── OrganizationCard/ # fields/, icons/, sections/, work-hours/
│   └── ui/              # shadcn/ui components
├── client/              # Auto-generated OpenAPI client
├── schemas/             # Zod validation schemas
├── hooks/               # Custom hooks
└── utils/               # Utilities
```

---

## Database

### Automatic Backups

In staging/production, `db-backup` container creates backups automatically:

- **Schedule:** Daily at 3:00 AM
- **Retention:** 30 daily, 4 weekly, 6 monthly
- **Location:** `./backups/`

```
./backups/
├── daily/
├── weekly/
└── monthly/
```

### Manual Backup

```bash
# In staging/production (container running)
docker compose exec db-backup /backup.sh

# In dev mode
docker compose --profile backup run --rm db-backup /backup.sh
```

### Restore from Backup

```bash
# Show available backups
./scripts/restore-db.sh

# Restore specific backup
./scripts/restore-db.sh ./backups/daily/app-2024-01-15.sql.gz
```

### Backup Configuration

Environment variables in docker-compose.yml:

| Variable | Default | Description |
|----------|---------|-------------|
| `SCHEDULE` | `0 3 * * *` | Cron schedule |
| `BACKUP_KEEP_DAYS` | `30` | Daily backups retention |
| `BACKUP_KEEP_WEEKS` | `4` | Weekly backups retention |
| `BACKUP_KEEP_MONTHS` | `6` | Monthly backups retention |

### Seed Data

Populate database with test data for development:

```bash
# Inside backend container
docker compose exec backend python -m scripts.seed_data

# Or locally
cd backend && python -m scripts.seed_data
```

Available seeders: users, news, persons, positions.

---

## Scripts

| Script | Description |
|--------|-------------|
| `start-staging.sh` | Start staging environment (requires real server) |
| `stop-staging.sh` | Stop staging environment |
| `start-production.sh` | Start production environment |
| `stop-production.sh` | Stop production environment |
| `start-traefik.sh` | Start Traefik reverse proxy (called by staging/production scripts) |
| `restore-db.sh` | Restore database from backup |

---

## Docker Services

| Service | Description | Dev | Staging | Prod |
|---------|-------------|-----|---------|------|
| db | PostgreSQL 17 | ✓ | ✓ | ✓ |
| backend | FastAPI | ✓ | ✓ | ✓ |
| frontend | React (nginx/vite) | ✓ | ✓ | ✓ |
| prestart | Migrations | ✓ | ✓ | ✓ |
| db-backup | Auto backups | — | ✓ | ✓ |
| mailcatcher | Email testing | ✓ | — | — |
| traefik | Reverse proxy | — | ✓ | ✓ |

---

## Environments

| Aspect | Dev | Staging | Production |
|--------|-----|---------|------------|
| Where | Local machine | Real server | Real server |
| Command | `docker compose up` | `./scripts/start-staging.sh` | `./scripts/start-production.sh` |
| HTTPS | — | Let's Encrypt | Let's Encrypt |
| Domain | localhost | staging.example.com | example.com |
| Email | mailcatcher | Real SMTP | Real SMTP |
| Backups | — | Automatic | Automatic |
| Purpose | Development | Testing before release | Live users |

### URLs by Environment

#### Development (local)
| Service | URL |
|---------|-----|
| Public site | http://localhost:5173 |
| Dashboard | http://localhost:5173 (same, check via login) |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |
| Mailcatcher UI | http://localhost:1080 |

#### Staging (real server)
| Service | URL |
|---------|-----|
| Public site | https://staging.example.com |
| Dashboard | https://dashboard.staging.example.com |
| Backend API | https://api.staging.example.com |
| Traefik Dashboard | https://traefik.staging.example.com |

#### Production (real server)
| Service | URL |
|---------|-----|
| Public site | https://example.com |
| Dashboard | https://dashboard.example.com |
| Backend API | https://api.example.com |
| Traefik Dashboard | https://traefik.example.com |
