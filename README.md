# Real-Time Group Chat System MVP

A minimal real-time group chat system demonstrating end-to-end architecture, system design, and implementation skills. Built with React, Node.js, Express.js, and WebSockets.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Documentation](#api-documentation)
- [WebSocket Protocol](#websocket-protocol)
- [Development](#development)
- [Testing](#testing)
- [Code Quality](#code-quality)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser with WebSocket support

### Installation & Running

**Backend:**

```bash
cd backend
npm install
npm start          # Start HTTP and WebSocket servers
npm start:dev     # Start with auto-reload (watch mode)
```

This starts:
- HTTP REST API server on port **3000** (configurable via `HTTP_PORT` env var)
- WebSocket server on port **8080** (configurable via `WS_PORT` env var)
- Job worker service that processes pending jobs every 500ms

**Frontend:**

```bash
cd frontend
npm install
npm start          # Start Vite dev server on http://localhost:5173
```

The frontend automatically connects to:
- REST API: `http://localhost:3000` (configurable via `VITE_API_URL`)
- WebSocket: `ws://localhost:8080` (configurable via `VITE_WS_URL`)

## Architecture

```
┌─────────────┐
│   Frontend  │  React SPA with WebSocket client
│   (React)   │
└──────┬──────┘
       │
       ├─── HTTP/REST ────┐  POST /jobs, GET /jobs/:id
       │                  │
       └─── WebSocket ────┤  Real-time messaging
                          │
                  ┌───────▼───────┐
                  │   Backend     │  Express.js + ws library
                  │  (Express.js) │
                  └───────┬───────┘
                          │
          ┌───────────────┼───────────────┐
          │               │                │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌──────▼──────┐
    │ In-Memory │  │  WebSocket │  │   Dummy     │
    │   Store   │  │   Server   │  │   Worker    │
    │   (Map)   │  │    (ws)    │  │  (100ms)    │
    └───────────┘  └────────────┘  └─────────────┘
```

### Key Components

- **Frontend**: React SPA with `useWebSocket` hook, Base64 file encoding, and job status polling
- **Backend**: Express.js REST API + WebSocket server using `ws` library
- **Storage**: In-memory Map with PostgreSQL-ready interface (ready for migration)
- **Processing**: Dummy worker service that simulates async job processing (100ms delay)
- **Logging**: Winston structured logging with JSON format

### Data Flow

1. **Chat Message Flow**: Client → WebSocket → Store → Broadcast to all clients
2. **File Upload Flow**: Client → REST API (create job) → WebSocket (file data) → Store → Worker (process) → Job Complete

See `docs/design-doc.md` for comprehensive architecture documentation.

## Project Structure

```
chat-mvp/
├── backend/           # Node.js/Express backend
│   ├── src/
│   │   ├── api/       # REST API endpoints
│   │   ├── models/    # Re-export from common
│   │   ├── services/  # Job worker service
│   │   ├── store/     # In-memory store
│   │   ├── utils/     # Logger utilities
│   │   ├── websocket/ # WebSocket server
│   │   └── index.ts   # Entry point
│   └── __tests__/     # Unit & integration tests
│       ├── builders/  # Test data builders
│       └── integration/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/      # React hooks (useWebSocket)
│   │   ├── utils/       # Utilities (Base64)
│   │   └── testkit/     # Test drivers
│   └── __tests__/       # Unit tests
├── common/             # Shared types & enums
│   └── src/types/       # Job, Message types
└── docs/                # Design documentation
```

## Features

### Implemented (MVP)

- ✅ **Real-time chat messaging** via WebSocket
- ✅ **File uploads** (Base64 encoded through WebSocket)
- ✅ **Job processing** with status polling (REST API)
- ✅ **Auto-reconnect** with exponential backoff (max 5 attempts)
- ✅ **In-memory storage** (PostgreSQL-ready interface)
- ✅ **Structured logging** (Winston)
- ✅ **Graceful shutdown** (SIGTERM/SIGINT handlers)

### Future Improvements (Production)

- User authentication & authorization
- Multiple chat rooms
- Message persistence across sessions
- File storage in cloud services (S3)
- Message delivery acknowledgments
- Rate limiting & throttling
- Dead Letter Queue (DLQ)
- Idempotency keys
- Persistent message queues (RabbitMQ/Redis)
- Horizontal scaling (load balancers, Redis pub/sub)

## API Documentation

### REST Endpoints

#### `POST /jobs`

Create a new job (file upload or chat message).

**Request Body:**
```json
{
  "type": "file_upload",
  "payload": {
    "fileName": "test.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024,
    "data": "base64encodeddata"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "job-uuid",
  "status": "pending",
  "type": "file_upload",
  "payload": { ... },
  "createdAt": "2025-10-31T12:00:00.000Z",
  "updatedAt": "2025-10-31T12:00:00.000Z"
}
```

#### `GET /jobs/:id`

Get job status.

**Response:** `200 OK`
```json
{
  "id": "job-uuid",
  "status": "completed",
  "type": "file_upload",
  "payload": { ... },
  "result": {
    "processedAt": "2025-10-31T12:00:05.000Z",
    "message": "File test.pdf processed successfully"
  },
  "createdAt": "2025-10-31T12:00:00.000Z",
  "updatedAt": "2025-10-31T12:00:05.000Z"
}
```

**Job Status Values:**
- `pending` - Job is queued for processing
- `processing` - Job is currently being processed
- `completed` - Job completed successfully
- `failed` - Job failed (not implemented in MVP)

## WebSocket Protocol

### Client → Server

**Chat Message:**
```json
{
  "type": "chat",
  "userId": "user-123",
  "content": "Hello, world!"
}
```

**File Upload:**
```json
{
  "type": "file",
  "userId": "user-123",
  "fileName": "test.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "data": "base64encodeddata"
}
```

### Server → Client

**Message Broadcast:**
```json
{
  "id": "msg-uuid",
  "userId": "user-123",
  "content": "Hello, world!",
  "type": "message",
  "timestamp": "2025-10-31T12:00:00.000Z"
}
```

**File Broadcast:**
```json
{
  "id": "msg-uuid",
  "userId": "user-123",
  "content": "test.pdf",
  "type": "file",
  "fileData": {
    "fileName": "test.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024,
    "data": "base64encodeddata"
  },
  "timestamp": "2025-10-31T12:00:00.000Z"
}
```

## Development

### Code Style

- **Indentation**: 4 spaces
- **Quotes**: Single quotes
- **Trailing commas**: Always
- **Semicolons**: Always
- **Line length**: 120 characters (soft limit)

### TypeScript Standards

- **Strict mode**: Enabled
- **No `any` types**: Use proper types or `unknown`
- **No type assertions**: Use type narrowing instead
- **Enums**: Use TypeScript enums (not string literals)
- **Builders**: Use builders for test data (no inline objects)

### SOLID Principles

- **Single Responsibility**: Small, focused functions
- **Open/Closed**: Ready for extension (e.g., store interface → PostgreSQL)
- **Liskov Substitution**: Interface-based design
- **Interface Segregation**: Focused interfaces (Store, Logger)
- **Dependency Inversion**: Depend on abstractions

### File Organization

- **Co-located tests**: `.test.ts` files next to source
- **Builders**: `__tests__/builders/` for test data
- **Integration tests**: `__tests__/integration/`
- **Shared types**: `common/src/types/` (imported via `@chat-mvp/common`)

## Testing

### Running Tests

**Backend:**
```bash
cd backend
npm test              # Run all tests
npm test:watch        # Watch mode
npm test:ci           # CI mode (no watch)
```

**Frontend:**
```bash
cd frontend
npm test              # Run all tests
npm test:watch        # Watch mode
npm test:ci           # CI mode (no watch)
```

### Test Coverage

- **Backend**: 35 tests (32 unit + 3 integration)
  - Models, Store, Services, API, WebSocket, Integration flows
- **Frontend**: 19 tests
  - Hooks, Utilities, Components

### Testing Patterns

- **TDD**: Write tests first, then implement
- **Builders**: Use `aJob()` and `aMessage()` builders (no inline objects)
- **Drivers**: Use `JestDriver` pattern for component tests
- **Fakes over mocks**: Prefer fakes (in-memory store) over mocks
- **Deterministic**: No branching in tests, fail-fast assertions

### Integration Tests

Integration tests verify end-to-end flows:
- Chat message flow: Send → Store → Broadcast → Receive
- File upload flow: REST job → WebSocket file → Job processing
- Multiple clients broadcasting

## Code Quality

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### Build

```bash
# Backend
cd backend
npm run build       # Compiles TypeScript to dist/

# Frontend
cd frontend
npm run build       # Type-checks TypeScript
```

### Dependencies

- **Backend**: Express, ws, winston, uuid, cors, tsx
- **Frontend**: React, Vite, @testing-library/jest-dom, sass
- **Common**: Shared TypeScript types (no runtime dependencies)

## Environment Variables

**Backend:**
- `HTTP_PORT` - HTTP server port (default: 3000)
- `WS_PORT` - WebSocket server port (default: 8080)
- `LOG_LEVEL` - Winston log level (default: info)

**Frontend:**
- `VITE_API_URL` - REST API URL (default: http://localhost:3000)
- `VITE_WS_URL` - WebSocket URL (default: ws://localhost:8080)

## Limitations (MVP)

- **File upload size**: Base64 encoding increases size by ~33%, not suitable for large files
- **No persistence**: All data is lost on server restart
- **Single room**: No multi-room support
- **No auth**: No user authentication or authorization
- **In-memory store**: Not suitable for production scale
- **No retry logic**: HTTP errors not retried (MVP)
- **No DLQ**: Failed messages are lost (MVP)

See `docs/design-doc.md` for production migration plans.

## License

Private project - for evaluation purposes only.
