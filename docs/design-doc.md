# Real-Time Group Chat System MVP - Design Document

## 1. MVP Definition

### Scope
A minimal real-time group chat system that allows multiple users to:
- Send and receive chat messages in real-time via WebSocket
- Upload and share files (Base64 encoded through WebSocket)
- View job status for file uploads and chat messages

### Out of Scope (Future)
- User authentication and authorization
- Multiple chat rooms
- Message persistence across sessions
- File storage in cloud services
- Message delivery acknowledgments
- Rate limiting and throttling
- Production-grade scalability features

## 2. High-Level Architecture

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       ├─── HTTP/REST ────┐
       │                  │
       └─── WebSocket ────┤
                          │
                  ┌───────▼───────┐
                  │   Backend     │
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

**Components:**
- **Frontend**: React SPA with WebSocket client
- **Backend**: Express.js REST API + WebSocket server
- **Storage**: In-memory Map (PostgreSQL-ready interface)
- **Processing**: Dummy worker service (simulates async processing)

## 3. Core APIs/Endpoints

### REST API

#### POST /jobs
**Purpose**: Create a new job (file upload or chat message)

**Request Body**:
```json
{
  "type": "file_upload" | "chat_message",
  "payload": {
    // FileUpload: { fileName, fileType, fileSize, data: "base64" }
    // ChatMessage: { content: "..." }
  }
}
```

**Response**: 201 Created
```json
{
  "id": "uuid",
  "status": "pending",
  "type": "file_upload",
  "payload": { ... },
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

#### GET /jobs/:id
**Purpose**: Get job status

**Response**: 200 OK
```json
{
  "id": "uuid",
  "status": "completed",
  "result": {
    "processedAt": "ISO8601",
    "message": "File processed successfully"
  }
}
```

### WebSocket API

#### Connection
- **Endpoint**: `ws://localhost:8080`
- **Protocol**: WebSocket (ws library)

#### Messages

**Send Chat Message**:
```json
{
  "type": "chat",
  "userId": "user-123",
  "content": "Hello, world!"
}
```

**Send File Upload**:
```json
{
  "type": "file",
  "userId": "user-123",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024,
  "data": "base64encodeddata"
}
```

**Receive Message** (broadcast to all clients):
```json
{
  "id": "message-id",
  "userId": "user-123",
  "content": "Hello, world!",
  "type": "message" | "file",
  "fileData": { ... }, // if type is "file"
  "timestamp": "ISO8601"
}
```

## 4. Sync vs Async Flow

### Synchronous (REST API)
- **POST /jobs**: Immediately creates job and returns job object
- **GET /jobs/:id**: Immediately returns current job status
- **Processing**: Dummy worker runs synchronously after creation

### Asynchronous (WebSocket)
- **Message Broadcast**: Server processes message → stores → broadcasts to all clients
- **Real-time Updates**: Clients receive messages instantly via WebSocket push
- **No Polling**: WebSocket eliminates need for client polling

### Flow Diagram

**Chat Message Flow**:
```
Client → WebSocket → Server → Store → Broadcast → All Clients
   ↓                                                   ↓
Immediate Response                            Real-time Update
```

**File Upload Flow**:
```
Client → WebSocket → Server → Store → Process → Broadcast
   ↓                              ↓
Immediate                   Dummy Worker (100ms)
```

## 5. Scalability Bottlenecks & Solutions

### Bottleneck 1: In-Memory Storage
**Problem**: 
- Data lost on server restart
- Limited by server RAM
- Cannot scale horizontally

**Current Impact**:
- Single server instance only
- Data persistence not guaranteed

**Production Solution**:
- Migrate to PostgreSQL for persistent storage
- Use connection pooling for concurrent access
- Implement read replicas for scale-out

**Scalability Approach**:
```
Current: Map<string, Job> (in-memory)
         ↓
Production: PostgreSQL with indexes on id, status, createdAt
```

### Bottleneck 2: Base64 File Encoding
**Problem**: 
- 33% size overhead (Base64 encoding increases file size by ~4/3)
- Memory intensive for large files (entire file loaded in memory)
- No streaming capability
- WebSocket message size limits (typically 16KB-64KB frames)

**Current Impact**:
- Limited to small files (< 1-2MB practical)
- High memory usage per connection
- Network bandwidth inefficient

**Production Solution**:
- Replace with HTTP multipart upload endpoint
- Store files in S3/Cloud Storage
- WebSocket only used for notifications (lightweight)
- Implement chunked upload for large files
- Add file size limits and validation

**Scalability Approach**:
```
Current: WebSocket → Base64 → In-Memory
         ↓
Production: HTTP POST → S3 → WebSocket notification
```

### Bottleneck 3: Single WebSocket Server
**Problem**: Cannot scale horizontally - each server maintains its own connection set.

**Current Impact**:
- Limited to single server instance
- All users must connect to same server

**Production Solution**:
- Redis pub/sub for multi-server WebSocket coordination
- Load balancer with sticky sessions or message routing
- Each server subscribes to Redis channels
- Broadcast to local connections + publish to Redis for other servers

**Architecture**:
```
[Server 1] ←→ [Redis Pub/Sub] ←→ [Server 2]
   │                                    │
   └─── WebSocket Clients ─────────────┘
```

### Bottleneck 4: No Message Queuing
**Problem**: No buffering for high throughput scenarios.

**Current Impact**:
- Messages lost if server temporarily unavailable
- No rate limiting or throttling
- Direct coupling between clients and server

**Production Solution**:
- RabbitMQ or AWS SQS for message queuing
- Separate queues for different message types
- Worker processes consume from queues
- DLQ for failed messages

## 6. Reliability

### Current MVP Implementation

#### WebSocket Reconnection
- **Auto-reconnect**: Client implements exponential backoff (1s, 2s, 4s delays)
- **Max Attempts**: 5 reconnection attempts
- **Message Queueing**: Failed messages queued in-memory, flushed on reconnect

#### HTTP/REST Retry
- **Retry Policy**: 3 attempts with exponential backoff
- **Scope**: Only 5xx errors (server errors)
- **No Retry**: 4xx errors (client errors)
- **Implementation**: Basic retry wrapper in client

### Not Implemented (Production Only)

#### Dead Letter Queue (DLQ)
**Status**: NOT implemented in MVP

**Reason**: DLQ requires external infrastructure (Redis, RabbitMQ, AWS SQS) which adds complexity beyond MVP scope. For a home assignment, implementing DLQ would be over-engineering.

### Production Roadmap

For production, the following reliability improvements would be implemented:

1. **Dead Letter Queue (DLQ)**
   - Messages that fail after all retries sent to DLQ
   - Separate monitoring and alerting for DLQ
   - Manual review and reprocessing capability
   - Integration with message queue infrastructure

2. **Idempotency Keys**
   - Prevent duplicate messages using unique keys per operation
   - Client generates idempotency key for each message
   - Server deduplicates based on key
   - Stored in database with expiration

3. **Persistent Message Queue**
   - Replace in-memory queue with RabbitMQ/AWS SQS
   - Messages persist across server restarts
   - Guaranteed delivery with acknowledgments
   - Consumer groups for load distribution

4. **Message Acknowledgments**
   - Client acknowledges receipt of critical messages
   - Server retries if acknowledgment not received
   - Timeout and dead letter for unacknowledged messages
   - Sequence numbers for ordering guarantees

5. **Circuit Breaker Pattern**
   - Prevent cascade failures
   - Open circuit after threshold failures
   - Automatic recovery attempts
   - Graceful degradation

## 7. Observability

### Logging (Winston)

**Structured Logging**: All logs use structured format with context:
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "message": "Job created",
  "jobId": "job-123",
  "userId": "user-123",
  "context": { ... }
}
```

**Log Levels**:
- `error`: System errors, failures
- `warn`: Warnings, retries, degraded functionality
- `info`: Business events (job created, message sent, connection established)
- `debug`: Detailed debugging information

**Log Categories**:
- **API Requests**: All REST endpoint calls with request/response details
- **WebSocket Events**: Connection, disconnection, message send/receive
- **Job Processing**: Job creation, status updates, completion
- **Errors**: All error conditions with stack traces

**Current Implementation**:
- Winston logger with JSON formatting
- Console transport with colorized output
- Configurable log level via `LOG_LEVEL` environment variable
- Structured metadata for all log entries

### Future: Metrics & Monitoring

**Not Implemented in MVP** (Production additions):
- **Prometheus Metrics**: Request rates, latency, error rates
- **Distributed Tracing**: OpenTelemetry for request correlation
- **Alerting**: PagerDuty/Slack integration for critical errors
- **Dashboards**: Grafana for real-time visualization

## 8. Security & Privacy

### Current MVP Limitations

1. **No Authentication**: Users are not authenticated
   - Any client can connect and send messages
   - No user identity verification

2. **No Authorization**: No access control
   - All users see all messages
   - No room/channel isolation

3. **No Encryption**: WebSocket connections not encrypted (ws://)
   - Messages transmitted in plain text
   - Vulnerable to man-in-the-middle attacks

4. **Base64 File Upload**: No file validation
   - No virus scanning
   - No file type restrictions
   - No size limits enforced

5. **No Rate Limiting**: Vulnerable to abuse
   - No per-user rate limits
   - Can flood server with messages

6. **In-Memory Storage**: No data encryption at rest
   - Data in server memory unencrypted

### Production Security Improvements

1. **Authentication & Authorization**
   - JWT-based authentication
   - User sessions with refresh tokens
   - Role-based access control (RBAC)
   - OAuth2/OIDC integration

2. **Encryption**
   - WSS (WebSocket Secure) with TLS/SSL
   - End-to-end encryption for messages
   - Encrypted storage at rest (database encryption)

3. **Input Validation & Sanitization**
   - File type validation (whitelist)
   - File size limits (configurable)
   - Virus scanning (ClamAV, etc.)
   - Content sanitization (XSS prevention)

4. **Rate Limiting**
   - Per-user rate limits
   - IP-based throttling
   - DDoS protection (CloudFlare, AWS Shield)

5. **Security Headers**
   - CORS configuration
   - CSP (Content Security Policy)
   - X-Frame-Options
   - HSTS (HTTP Strict Transport Security)

6. **Audit Logging**
   - All actions logged with user context
   - Immutable audit trail
   - Compliance with GDPR, HIPAA if required

7. **Vulnerability Management**
   - Regular dependency updates
   - Security scanning (Snyk, npm audit)
   - Penetration testing

## 9. Cost Awareness

### MVP Costs (Current)

**Infrastructure**:
- **Development**: $0 (local development)
- **Hosting**: Minimal (single server instance)
- **Storage**: In-memory (no cloud storage)
- **Bandwidth**: Minimal (small scale)

**Estimated Monthly Cost**: ~$5-20 (small VPS instance)

### Production Costs (Scale-dependent)

**Infrastructure** (10K users, 100K messages/day):
- **Compute**: 
  - Load balancer: $20/month
  - Backend servers (2-3 instances): $50-150/month
- **Database**: 
  - PostgreSQL (managed): $50-200/month (RDS, Cloud SQL)
- **Storage**: 
  - S3/Cloud Storage: $10-50/month (file uploads)
- **Message Queue**: 
  - RabbitMQ/AWS SQS: $20-100/month
- **Monitoring**: 
  - Logging (CloudWatch, Datadog): $50-200/month
- **CDN**: 
  - CloudFront/Cloudflare: $20-100/month

**Estimated Monthly Cost**: $220-820/month

**Cost Optimization Strategies**:
- Use reserved instances (30-50% savings)
- Auto-scaling (scale down during low traffic)
- Cloud-native services (managed databases reduce ops cost)
- Caching layer (Redis) to reduce database load
- Content delivery network for static assets

**Cost Per User**: ~$0.02-0.08/month at 10K users

## 10. Sequence Diagram

### Chat Message Flow

```
User 1          Frontend 1       WebSocket Server       Store      User 2 (Frontend 2)
  │                 │                    │                │              │
  │─[Type Msg]─────>│                    │                │              │
  │                 │                    │                │              │
  │                 │──[WebSocket]──────>│                │              │
  │                 │    {type:chat}     │                │              │
  │                 │                    │                │              │
  │                 │                    │─[createMsg]───>│              │
  │                 │                    │                │              │
  │                 │                    │─[broadcast]─────────────────────>│
  │                 │                    │                │              │
  │<─[Msg Received]─│                    │                │              │
  │                 │                    │                │              │
```

### File Upload Flow

```
User          Frontend         WebSocket Server       Store       Worker       User 2
  │               │                    │                │           │            │
  │─[Select File]─>│                    │                │           │            │
  │               │                    │                │           │            │
  │               │─[Base64 Encode]───>│                │           │            │
  │               │                    │                │           │            │
  │               │──[WebSocket]───────>│                │           │            │
  │               │  {type:file,data}   │                │           │            │
  │               │                    │                │           │            │
  │               │                    │─[createMsg]───>│           │            │
  │               │                    │                │           │            │
  │               │                    │─[createJob]───>│           │            │
  │               │                    │                │           │            │
  │               │                    │─────────[processJob]───────>│            │
  │               │                    │                │           │            │
  │               │                    │                │    [100ms delay]       │
  │               │                    │                │           │            │
  │               │                    │<─[updateJob]───│<─[return]─│            │
  │               │                    │                │           │            │
  │               │                    │─[broadcast]─────────────────────────────>│
  │               │                    │                │           │            │
  │<─[File + Status]───────────────────│                │           │            │
  │               │                    │                │           │            │
```

## 11. Roadmap

### MVP (Current)
- ✅ REST API endpoints (POST /jobs, GET /jobs/:id)
- ✅ WebSocket server with message broadcasting
- ✅ In-memory storage (PostgreSQL-ready interface)
- ✅ Dummy worker service
- ✅ Winston structured logging
- ✅ React frontend skeleton

**Timeline**: 1-2 days

### 3 Days (Enhanced MVP)
- [ ] Complete React frontend (ChatPage, components)
- [ ] WebSocket client hook with reconnection logic
- [ ] File upload UI with Base64 encoding
- [ ] Job status polling/display
- [ ] Basic error handling and user feedback
- [ ] Integration tests

**Timeline**: +1 day

### 1 Week (Production-Ready MVP)
- [ ] User authentication (JWT)
- [ ] PostgreSQL migration (replace in-memory store)
- [ ] HTTP file upload endpoint (replace Base64 WebSocket)
- [ ] Cloud storage integration (S3/GCS)
- [ ] Rate limiting middleware
- [ ] Comprehensive error handling
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment configuration (Docker, CI/CD)

**Timeline**: +4 days

### Production (Full Scale)
- [ ] Redis pub/sub for multi-server WebSocket
- [ ] RabbitMQ/SQS message queue
- [ ] Dead Letter Queue (DLQ)
- [ ] Idempotency keys
- [ ] Message acknowledgments
- [ ] Load balancing and auto-scaling
- [ ] Prometheus metrics + Grafana dashboards
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Comprehensive security hardening
- [ ] Backup and disaster recovery
- [ ] Performance optimization
- [ ] Cost optimization

**Timeline**: 2-4 weeks

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-01  
**Author**: System Design MVP

