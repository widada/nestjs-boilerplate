# NestJS Boilerplate

A production-ready NestJS boilerplate with authentication, database management, REST API, and real-time WebSocket chat functionality.

## Features

-  **JWT Authentication** - Secure user authentication with Passport
-  **TypeORM Integration** - MySQL database with migration support
-  **CRUD Operations** - Complete user and post management
-  **Real-time Chat** - WebSocket chat with Socket.IO
-  **Validation** - Request validation with class-validator
-  **Clean Architecture** - Modular structure following NestJS best practices

## Tech Stack

- **Framework**: NestJS 11
- **Database**: MySQL + TypeORM
- **Authentication**: JWT + Passport
- **WebSocket**: Socket.IO
- **Validation**: class-validator & class-transformer
- **Password Hashing**: bcrypt

---

## Installation

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=nestjs_boilerplate

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Application
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

Make sure MySQL is running, then run migrations:

```bash
npm run migration:run
```

### 4. Run the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

The server will start at `http://localhost:3000`

---

## API Documentation

All API endpoints are prefixed with `/api`

### Authentication

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": { ... },
  "access_token": "eyJhbGci..."
}
```

### Posts (Protected)

#### Create Post
```bash
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Post Title",
  "content": "Post content here",
  "published": true
}
```

#### Get All Posts
```bash
GET /api/posts
```

#### Get Single Post
```bash
GET /api/posts/:id
```

#### Update Post
```bash
PATCH /api/posts/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title"
}
```

#### Delete Post
```bash
DELETE /api/posts/:id
Authorization: Bearer {token}
```

### Chat Rooms

#### Create Room
```bash
POST /api/chat/rooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "general",
  "description": "General discussion room",
  "isPrivate": false
}
```

#### Get All Rooms
```bash
GET /api/chat/rooms
```

#### Get Room Messages
```bash
GET /api/chat/rooms/:roomId/messages
```

---

## WebSocket Chat

The chat system uses Socket.IO on the `/chat` namespace.

### Connection
```javascript
const socket = io('http://localhost:3000/chat');
```

### Events

#### Client → Server

**Join Room**
```javascript
socket.emit('joinRoom', { 
  room: 'general', 
  username: 'John' 
});
```

**Send Message**
```javascript
socket.emit('sendMessage', {
  room: 'general',
  message: 'Hello everyone!',
  username: 'John'
});
```

**Leave Room**
```javascript
socket.emit('leaveRoom', { 
  room: 'general' 
});
```

**Typing Indicator**
```javascript
socket.emit('typing', {
  room: 'general',
  username: 'John',
  isTyping: true
});
```

#### Server → Client

**On Connect**
```javascript
socket.on('connected', (data) => {
  console.log('Client ID:', data.clientId);
});
```

**Receive Message**
```javascript
socket.on('message', (data) => {
  console.log(data.username, data.message);
});
```

**User Joined**
```javascript
socket.on('userJoined', (data) => {
  console.log(`${data.username} joined`);
});
```

**User Left**
```javascript
socket.on('userLeft', (data) => {
  console.log(`${data.username} left`);
});
```

**Room Users**
```javascript
socket.on('roomUsers', (data) => {
  console.log('Users:', data.users);
});
```

### Testing WebSocket

Open `test-chat.html` in your browser to test the chat functionality.

---

## Directory Structure

```
src/
├── common/                    # Shared utilities
│   └── guards/               # Auth guards (JWT)
│
├── config/                   # Configuration files
│   └── typeorm.config.ts    # Database configuration
│
├── database/                 # Database migrations
│   ├── 1704067200000-CreateUsersTable.ts
│   ├── 1704067300000-CreatePostsTable.ts
│   └── 1704067400000-CreateChatTables.ts
│
├── modules/                  # Feature modules
│   ├── auth/                # Authentication module
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── strategies/     # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/              # Users module
│   │   ├── entities/       # User entity
│   │   └── users.module.ts
│   │
│   ├── posts/              # Posts module (REST API)
│   │   ├── dto/           # Create/Update DTOs
│   │   ├── entities/      # Post entity
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   └── posts.module.ts
│   │
│   └── chat/               # Chat module (WebSocket)
│       ├── dto/           # Chat DTOs
│       ├── entities/      # Chat entities
│       ├── interfaces/    # TypeScript interfaces
│       ├── services/      # Business logic
│       │   ├── chat.service.ts          # Room management
│       │   ├── chat-message.service.ts  # Message management
│       │   └── chat-room.service.ts     # Active users tracking
│       ├── chat.gateway.ts              # WebSocket gateway
│       ├── chat.controller.ts           # REST endpoints
│       └── chat.module.ts
│
├── app.controller.ts         # Root controller
├── app.service.ts           # Root service
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

### Module Architecture

#### REST API Modules (Posts, Auth)
- **Controller**: Handles HTTP requests and responses
- **Service**: Business logic and database operations
- **Entity**: TypeORM database model
- **DTO**: Data validation and transformation
- **Module**: Binds everything together

#### WebSocket Module (Chat)
- **Gateway**: Handles WebSocket events and connections
- **Controller**: REST API for chat management
- **Services**: 
  - `chat.service.ts` - Room CRUD operations
  - `chat-message.service.ts` - Message persistence
  - `chat-room.service.ts` - In-memory active users tracking
- **Entities**: Database models for rooms and messages
- **DTOs**: WebSocket event validation

---

## Database Commands

```bash
# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate migration from entities
npm run migration:generate -- src/database/MigrationName
```

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:prod` | Start production server |
| `npm run build` | Build for production |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run lint` | Lint and fix code |
| `npm run format` | Format code with Prettier |

---

## License

MIT
