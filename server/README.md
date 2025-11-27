# Server Setup

Node.js + TypeScript + Express + Mongoose Server with Feature-Based Architecture

## 📁 Folder Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts   # MongoDB connection
│   │   └── env.ts        # Environment variables
│   ├── features/         # Feature-based modules (MVC structure)
│   │   └── users/        # Example: Users feature
│   │       ├── models/   # Database models
│   │       │   └── user.model.ts
│   │       ├── controllers/  # Request handlers
│   │       │   └── user.controller.ts
│   │       ├── services/     # Business logic
│   │       │   └── user.service.ts
│   │       ├── routes/       # Express routes
│   │       │   └── user.routes.ts
│   │       ├── types/        # TypeScript types
│   │       │   └── user.types.ts
│   │       └── index.ts      # Feature exports
│   ├── middleware/       # Custom middleware
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   ├── routes/           # Route aggregator
│   │   └── index.ts
│   ├── types/            # TypeScript type definitions
│   │   └── express.d.ts
│   └── index.ts          # Main entry point
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 3. Start Development Server

```bash
pnpm run dev
```

### 4. Build for Production

```bash
pnpm run build
pnpm start
```

## 📝 Available Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm run start:dev` - Start development server (single run)

## 🏗️ Feature-Based MVC Architecture

Each feature follows MVC (Model-View-Controller-Service) pattern and is self-contained in its own folder under `src/features/`:

- **models/** - Mongoose schemas and models
- **controllers/** - Request handlers (HTTP layer)
- **services/** - Business logic layer
- **routes/** - Express route definitions
- **types/** - TypeScript interfaces and DTOs
- **index.ts** - Feature exports (barrel file)

### Adding a New Feature

1. Create a new folder in `src/features/` (e.g., `products`)
2. Create MVC folders: `models/`, `controllers/`, `services/`, `routes/`, `types/`
3. Create files in respective folders following the pattern
4. Export routes in `src/routes/index.ts`
5. Routes will be available at `/api/{feature-name}`

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication (Telegram Chat ID Based)
- `POST /api/auth/signup` - Sign up with Telegram Chat ID
- `POST /api/auth/login` - Login with Telegram Chat ID
- `GET /api/auth/verify` - Verify JWT token

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🗄️ Database

MongoDB connection is configured in `src/config/database.ts`. Make sure MongoDB is running before starting the server.

## 🔐 Authentication

This server uses **Telegram Chat ID** for authentication. Users authenticate through a Telegram bot, and their Chat ID is used to sign up/login.

### How it works:

1. **Get Telegram Chat ID**: Users interact with the Telegram bot and use `/myid` command to get their Chat ID
2. **Sign Up**: Send POST request to `/api/auth/signup` with Telegram Chat ID and user details
3. **Login**: Send POST request to `/api/auth/login` with Telegram Chat ID
4. **Get JWT Token**: Both signup and login return a JWT token for authenticated requests

### Example Signup Request:
```json
POST /api/auth/signup
{
  "telegramChatId": 123456789,
  "name": "John Doe",
  "telegramUsername": "johndoe",
  "telegramFirstName": "John",
  "telegramLastName": "Doe"
}
```

### Example Login Request:
```json
POST /api/auth/login
{
  "telegramChatId": 123456789
}
```

### Protected Routes:
Use the `authenticate` middleware from `src/middleware/auth.middleware.ts` to protect routes. The JWT token should be sent in the `Authorization` header as `Bearer {token}`.

## 🤖 Telegram Bot

The server includes a Telegram bot service that:
- Provides commands to get Chat ID (`/start`, `/myid`, `/help`)
- Can be used to verify Chat IDs
- Sends notifications to users

**Setup**: Add `TELEGRAM_BOT_TOKEN` to your `.env` file. See `ENV_SETUP.md` for details.

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **node-telegram-bot-api** - Telegram Bot API
- **jsonwebtoken** - JWT token generation
- **bcryptjs** - Password hashing (if needed)
- **typescript** - TypeScript compiler
- **tsx** - TypeScript execution
- **dotenv** - Environment variables
- **cors** - CORS middleware
- **helmet** - Security headers
- **morgan** - HTTP request logger

