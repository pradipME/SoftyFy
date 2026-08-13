# SoftyFy

A private, personal music streaming web application for your own legally obtained or licensed music collection. No advertisements, no subscriptions, no payments, and no public music catalog — just your library, with high-quality playback and a Spotify-inspired experience.

> **Status:** Phase 4 — Audio Storage & Ingestion. Users can upload local audio files (MP3/FLAC/WAV/M4A/OGG); the backend validates, extracts metadata, deduplicates, and stores the bytes outside the database. Playback is still a later phase.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Java 21 + Spring Boot 3.5 + Maven (REST API) |
| Database | PostgreSQL 16 |
| Local infrastructure | Docker Compose |
| Deployment target | Render (planned, not yet deployed) |

## Repository Structure

```
SoftyFy/
├── backend/            # Spring Boot REST API
│   ├── src/main/java/com/softyfy/
│   │   ├── config/     # configuration (reserved)
│   │   ├── controller/ # REST controllers (reserved)
│   │   ├── service/    # business logic (reserved)
│   │   ├── repository/ # data access (reserved)
│   │   └── exception/  # error handling (reserved)
│   └── src/main/resources/
│       ├── application.yml          # base configuration
│       ├── application-local.yml    # local development profile
│       └── application-prod.yml     # production profile
├── frontend/           # React/Vite/Tailwind web app
│   └── src/
│       ├── App.tsx     # minimal placeholder page
│       └── index.css   # Tailwind entry
├── docker-compose.yml  # local PostgreSQL 16
├── render.yaml         # Render blueprint (preparation only)
└── .env.example        # environment variable reference
```

## Prerequisites

- **Java 21** JDK (e.g. Eclipse Adoptium 21). The Maven wrapper needs `JAVA_HOME` to point at the JDK, for example:
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
  ```
- **Node.js 20+** and npm (verified against Node 24 / npm 11).
- **Docker Desktop** (or another Docker engine) for local PostgreSQL. Docker is **not** installed on this development machine, so PostgreSQL cannot be started locally yet.

## Environment Variables

Copy `.env.example` to `.env` at the repository root and adjust values. The real `.env` file is git-ignored and must never be committed.

| Variable | Description | Default (dev) |
|---|---|---|
| `SOFTYFY_PROFILE` | Spring profile: `local` or `prod` | `local` |
| `SERVER_PORT` | Backend HTTP port | `8080` |
| `SOFTYFY_DB_HOST` | PostgreSQL host | `localhost` |
| `SOFTYFY_DB_PORT` | PostgreSQL port | `5432` |
| `SOFTYFY_DB_NAME` | Database name | `softyfy` |
| `SOFTYFY_DB_USER` | Database user | `softyfy` |
| `SOFTYFY_DB_PASSWORD` | Database password | `softyfy` (dev only) |
| `SOFTYFY_STORAGE_PROVIDER` | Audio storage backend; only `local` is implemented | `local` |
| `SOFTYFY_STORAGE_LOCAL_ROOT` | Root directory for local audio storage (git-ignored) | `./data/audio` |
| `SOFTYFY_AUDIO_MAX_FILE_SIZE_MB` | Maximum audio upload size | `200` |
| `VITE_API_BASE_URL` | Backend API base URL used by the frontend at build time | `http://localhost:8080` |

In the `prod` profile the database host, name, user and password are **required** — the application fails to start if any of them are missing.

## Adding Music

Use the **Add music** button (home, header, or Songs page). Select or drop audio
files (up to 200 MB each); the frontend uploads with progress and per-file
status. Metadata is read from the file's tags and can be overridden per batch.
See [`docs/STORAGE_ARCHITECTURE.md`](docs/STORAGE_ARCHITECTURE.md) for the
storage design and deduplication rules.

## PostgreSQL Setup (Docker Compose)

```powershell
docker compose up -d
```

Starts PostgreSQL 16 (`postgres:16.14`) on `127.0.0.1:5432` with a persistent named volume. Credentials come from the environment variables above (or safe dev defaults). The port is bound to loopback only and is not exposed to the public network.

Useful commands:
- `docker compose down` — stop the container (keeps data)
- `docker compose down -v` — stop and remove the data volume

## Backend Setup

```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"   # if not already set
./mvnw -v
```

### Run the Backend

```powershell
cd backend
./mvnw spring-boot:run
```

The application starts with the `local` profile by default and listens on `http://localhost:8080`. It requires PostgreSQL to be reachable (see Docker Compose above); without a database the application will not start.

### Health Endpoint

```
GET http://localhost:8080/actuator/health
```

The health endpoint is exposed via Spring Boot Actuator. In the `local` profile it reports detailed status including database connectivity (`db` component).

## Frontend Setup

```powershell
cd frontend
npm install
```

### Run the Frontend

```powershell
cd frontend
npm run dev
```

Opens the development server at `http://localhost:5173`. During development, `/api` and `/actuator` requests are proxied to `http://localhost:8080`.

### Build the Frontend

```powershell
cd frontend
npm run build
```

Produces a production build in `frontend/dist`.

## Build Verification

```powershell
# Backend: compile and package (requires JAVA_HOME)
cd backend
./mvnw clean package

# Frontend
cd frontend
npm install
npm run build
```

## Deployment

Deployment to Render is planned for a later phase. `render.yaml` contains a blueprint describing the intended architecture (Spring Boot web service, React static site, managed PostgreSQL), but **no deployment has been performed or verified yet**.

## License / Content

This project is intended for personal use with music you own or are licensed to play. Do not distribute or publicly stream content you do not have the rights to.
