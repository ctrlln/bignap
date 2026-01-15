# Local Authentication & RBAC System

This project implements a local-only JWT authentication system with Role-Based Access Control (RBAC) and a developer-only role override mechanism.

## Architecture

- **Backend**: Node.js, Express, SQLite (via `better-sqlite3`).
- **Auth**: JWT (Stateless).
- **Security**:
  - Passwords hashed with `bcryptjs`.
  - RBAC middleware (`requireRole`, `requireAnyRole`).
- **Dev Tools**: `X-Dev-Role-Override` header allows instantaneous role switching in Development mode without relogging.

## Getting Started

### 1. Start the Backend

```bash
cd server
npm install
npm run dev
```
The server runs on http://localhost:3000.
Database `local.db` is created automatically.

### 2. Start the Frontend

```bash
# In the root directory
npm install
npm run dev
```
The frontend runs on http://localhost:5173.

## Test Users & Credentials

All passwords are: `password123`

| Role | Name | Email |
|------|------|-------|
| **Admin** | Verna Schamberger | `verna.schamberger@test.local` |
| **Master Trainer** | Luther Jacobs | `luther.jacobs@test.local` |
| **Trainer** | Gayle Harvey | `gayle.harvey@test.local` |
| **Student** | Reed Beahan | `reed.beahan@test.local` |

## Dev Role Override

The UI has a "Role Switcher" (in the Feedback Drawer or similar dev tools).
When you select a role:
1. The frontend sets the `X-Dev-Role-Override` header.
2. The backend (if `NODE_ENV != production`) ignores the authenticated user's real roles and uses the header value.
3. This allows you to test Admin/Editor/User permissions instantly.

## API Endpoints

- `POST /api/auth/login` - Returns JWT and user info.
- `GET /api/admin/users` - Protected (Admin only).
- `GET /api/editor/content` - Protected (Editor or Admin).
- `GET /api/user/profile` - Protected (Any authenticated user).

## Project Structure

- `server/src/db.ts`: Database schema and seeding.
- `server/src/auth.ts`: Login logic and JWT generation.
- `server/src/middleware.ts`: RBAC logic and Dev Override implementation.
- `server/src/routes.ts`: API route definitions.
