# Real-Time Group Chat System MVP

A minimal real-time group chat system demonstrating end-to-end architecture, system design, and implementation skills. Built with React, Node.js, Express.js, and WebSockets.

### Installation & Running

**Backend:**

```bash
cd backend
npm install
npm start          # Start HTTP and WebSocket servers
npm start:dev     # Start with auto-reload (watch mode)
```

**Frontend:**

```bash
cd frontend
npm install
npm start          # Start Vite dev server on http://localhost:5173
```

See `docs/design-doc.md` for comprehensive architecture documentation.

### Future Improvements (Production)

- Better UI - current is basically undesigned
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

### REST Endpoints

#### `POST /jobs`

Create a new job (file upload or chat message).

#### `GET /jobs/:id`

Get job status.

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
- **No persistence**: All data is lost on refresh or any server restart
- **Single room**: No multi-room support
- **No auth**: No user authentication or authorization - everyone gets all messages
- **In-memory store**: Not suitable for production scale
- **No retry logic**: HTTP errors not retried (MVP)
- **No DLQ**: Failed messages are lost (MVP)

have fun :)
