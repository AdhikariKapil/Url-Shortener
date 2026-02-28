# URL shortener and Rate Limiter

A full-stack web application that shortens URLs and provides analytics with a custom rate-limiting mechanism. Built with Flask backend, React frontend, and Redis for rate-limiting and caching.

## Project Overview

This application allows users to shorten long URLs and track click analytics in real-time. The core components include:
- **REST API** for URL shortening and redirection with click tracking
- **React Dashboard** for URL management and analytics visualization
- **Custom Rate Limiter** preventing abuse (5 URLs per minute per IP)
- **Time-Series Analytics** showing click patterns over 7 days

Specifically, the rate limiter implementation avoids the overhead of asynchronous semaphore overhead by using Redis atomic operations instead of Python's native threading mechanisms. This ensures minimal latency and true distributed rate-limiting that works across multiple server instances.

## Tech Stack

### Backend
- Python 3.11 with Flask 3.1.3
- Redis 7 for rate-limiting and caching
- SQLite for URL and analytics storage
- CORS enabled for frontend communication

### Frontend
- React 19 with Vite build tool
- Chart.js for analytics visualization
- Tailwind CSS for styling
- Axios for API communication

### Infrastructure
- Docker containerization
- Docker Compose orchestration
- Redis Alpine image (lightweight)

## Quick Start

### Prerequisites
- Docker Desktop (or Docker + Docker Compose)
- Git

### Running on Recruiter's PC

1. **Clone/Extract the project**
   ```bash
   cd url_shortener
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the app**
   - Web App: http://localhost:5000
   - API: http://localhost:5000/api (or http://localhost:5000 directly)
   - Redis: localhost:6379 (internal)

That's it! The app will be fully running.

## What Each Docker File Does

### `Dockerfile` (Combined Image)
This is a **multi-stage build** that creates one single container with everything:

```
Stage 1: Build Frontend
├── Installs Node.js
├── Runs `npm install` and `npm run build`
└── Creates optimized React production build

Stage 2: Build Backend & Final Image
├── Uses Python 3.11 slim image (small size)
├── Installs Python dependencies from requirements.txt
├── Copies the built React frontend into Flask's static folder
└── Runs Flask on port 5000 to serve both API and frontend
```

**Why this approach?**
- Single container is easier to deploy to recruiter's PC
- Frontend and backend run together
- Minimal complexity
- Flask serves both the API and the built React app

### `docker-compose.yml` (Orchestration)
Manages two services:

1. **Redis Service**
   - Stores rate-limit counters
   - Stores click analytics
   - Runs on port 6379 internally
   - Has a health check (ping) to ensure it's ready

2. **App Service** (contains both frontend + backend)
   - Depends on Redis being healthy before starting
   - Exposes port 5000 to the recruiter's browser
   - Shares a Docker network for container communication
   - Redis talks to backend via service name `redis:6379`

**Why Redis in Docker?**
- Ensures recruiter doesn't need to install Redis separately
- Everything is self-contained
- Easy to reset (just `docker-compose down -v`)

### `.dockerignore`
Prevents Docker from copying unnecessary files (like node_modules, git, __pycache__) into the image, reducing image size.

## How the Rate Limiter Works

### Implementation Details

The rate limiter uses a **Sliding Window Counter** algorithm:

```
Request comes in → Check Redis key for IP address → 
If count < 5:
  ✅ Increment counter and allow request
  Set expiry to 60 seconds
Else:
  ❌ Return 429 Too Many Requests
  Include retry_after (seconds until they can try again)
```

### Key Implementation Points

**Location**: `backend/middleware/rate_limiter.py`

**How it works:**
1. Client IP is extracted from the request
2. Redis key format: `rate_limit:{ip}:{current_minute}`
3. Uses Redis `INCR` command (atomic - no race conditions)
4. LUA script in `backend/services/sliding_window_atomicity.lua` ensures atomicity
5. Key expires after 60 seconds

**Example Response When Limited:**
```json
{
  "message": "Rate limit exceeded",
  "retry_after": 45
}
```

The frontend shows a countdown timer using this `retry_after` value.

## API Endpoints

### 1. Shorten URL
```
POST /api/shorten
Content-Type: application/json

Request Body:
{
  "url": "https://www.example.com/very/long/url/path"
}

Response (200 OK):
{
  "short_url": "http://localhost:5000/abc123",
  "alias": "abc123"
}

Response (429 Too Many Requests):
{
  "message": "Rate limit exceeded",
  "retry_after": 45
}

Response (400 Bad Request):
{
  "message": "Invalid URL"
}
```

### 2. Redirect to Original URL
```
GET /{alias}

Example: GET /abc123

Response (302 Found):
Location: https://www.example.com/very/long/url/path
(Also increments click counter)

Response (404 Not Found):
{
  "message": "URL not found"
}
```

### 3. Get All Shortened URLs
```
GET /api/analytics

Response (200 OK):
{
  "urls": [
    {
      "id": 1,
      "original_url": "https://example.com",
      "alias": "abc123",
      "clicks": 15,
      "created_at": "2026-03-01T10:30:00"
    }
  ]
}
```

### 4. Get Analytics for Specific URL
```
GET /api/analytics/{alias}

Example: GET /api/analytics/abc123

Response (200 OK):
{
  "alias": "abc123",
  "original_url": "https://example.com",
  "total_clicks": 42,
  "daily_clicks": [
    {
      "date": "2026-02-22",
      "clicks": 5
    },
    {
      "date": "2026-02-23",
      "clicks": 8
    }
  ]
}

Response (404 Not Found):
{
  "message": "URL not found"
}
```

### 5. Health Check
```
GET /health

Response (200 OK):
{
  "status": "ok",
  "redis": "connected"
}
```

## Frontend Features

### URL Shortener Component
- Input field to paste long URLs
- Copy-to-clipboard button
- Rate limit countdown timer (if 429 received)
- Success/error messages

### Analytics Dashboard
- List of all shortened URLs
- Click on any URL to see detailed analytics
- Line chart showing clicks over last 7 days
- Refresh button to update data without reload
- "Click" count displayed

## Project Structure

```
url_shortener/
├── backend/
│   ├── app.py              # Flask app entry point
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   ├── middleware/
│   │   └── rate_limiter.py # Custom rate limiter
│   ├── models/
│   │   ├── database.py     # DB connection
│   │   ├── init_db.py      # Initialize tables
│   │   └── url_model.py    # URL data model
│   ├── routes/
│   │   ├── url_route.py    # /shorten endpoint
│   │   ├── analytics_route.py  # /analytics endpoints
│   │   └── health_route.py # /health endpoint
│   └── services/
│       ├── url_service.py       # URL business logic
│       ├── redis_service.py     # Redis connection
│       ├── analytics_service.py # Analytics logic
│       └── sliding_window_atomicity.lua # Atomic Redis script
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UrlShortener.jsx    # URL input form
│   │   │   ├── Dashboard.jsx       # Main page
│   │   │   ├── AnalyticsChart.jsx  # Chart.js wrapper
│   │   │   └── UrlTable.jsx        # URL list
│   │   ├── services/
│   │   │   └── api.js              # Axios instance
│   │   └── App.jsx
│   ├── vite.config.js
│   └── package.json
│
├── Dockerfile           # Multi-stage build
├── docker-compose.yml   # Service orchestration
├── .dockerignore       # Files to exclude from Docker
├── .env.example        # Example environment variables
└── README.md           # This file
```

## Key Design Decisions

### Why Multi-Stage Docker Build?
- The frontend is built during Docker build (React → HTML/CSS/JS)
- Only needs Node.js for building, not at runtime
- Final image only contains Python + built static files
- Keeps image small (~200MB instead of ~500MB)

### Why Flask Serves Frontend?
- Single container = single deployment unit
- No need to configure nginx or separate servers
- Flask's `static` folder serves React build automatically
- Simpler for testing on recruiter's PC

### Why Redis on Docker?
- No system dependencies needed
- Isolated environment
- Easy to reset/clean up
- Same setup works everywhere (Windows/Mac/Linux)

### Rate Limiter Design
- Redis provides distributed rate-limiting (works across instances)
- LUA script ensures atomic operations (no race conditions)
- Per-IP limiting prevents single user from blocking service
- 5 URLs/minute is per IP, not global

## Troubleshooting

### App won't start
```bash
docker-compose logs app
```
Check for Python or dependency errors.

### Port 5000 already in use
```bash
# Either kill the process or change the port in docker-compose.yml
# docker-compose.yml line: "5000:5000" → "8000:5000"
```

### Redis connection error
```bash
docker-compose logs redis
```
The Redis service might be taking time to start. It has a health check; the app waits for it.

### Frontend shows "Cannot POST /api/shorten"
Check that the React app was built correctly. Run:
```bash
docker-compose down
docker-compose up --build  # Force rebuild
```

### Reset everything (clean slate)
```bash
docker-compose down -v
docker-compose up --build
```

## Testing Manually

### Using curl to test API

```bash
# Shorten a URL
curl -X POST http://localhost:5000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.github.com"}'

# Get all URLs
curl http://localhost:5000/api/analytics

# Get specific URL analytics
curl http://localhost:5000/api/analytics/abc123

# Check health
curl http://localhost:5000/health
```

### Test rate limiter (run 6 times quickly)
```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/shorten \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"https://example.com/$i\"}"
  echo "\n"
done
```
The 6th request should get a 429 error.

## Useful Docker Commands

```bash
# View logs
docker-compose logs -f app
docker-compose logs -f redis

# Stop everything
docker-compose down

# Remove everything including volumes
docker-compose down -v

# Execute command in container
docker exec -it url_shortener_app bash

# Check running containers
docker ps
```

## Performance Notes

- Rate limiter: O(1) Redis operations (very fast)
- Analytics queries: Grouped by date for efficiency
- Frontend chart: Only fetches last 7 days to keep response small
- Database: SQLite suitable for moderate traffic (< 1000 requests/min)

## Future Improvements

1. **Database**: Switch to PostgreSQL for production
2. **Frontend**: Add user authentication
3. **Analytics**: Store detailed hit information (referrer, user agent)
4. **Monitoring**: Add prometheus metrics
5. **Caching**: Implement Redis caching for analytics queries
6. **QR Codes**: Generate QR codes for shortened URLs

## Notes for Recruiter

- All code follows Python naming conventions (snake_case for functions/variables, PascalCase for classes)
- React uses functional components with hooks (modern es6+)
- Clean separation of concerns: routes → services → models
- Error handling for edge cases (invalid URLs, network timeouts, etc.)
- Database schema is normalized to prevent redundant data
- CORS properly configured for cross-origin requests

---

**Questions?** Check the individual files in `backend/` and `frontend/` directories for detailed implementation.
