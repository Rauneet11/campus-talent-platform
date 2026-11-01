# Campus Talent Platform

A full-stack campus project management application with role-based access control for Admins, Teachers, and Students.

## Architecture

```
campus/
├── client/          # React + Vite frontend (Bootstrap + react-icons)
│   ├── src/
│   │   ├── App.jsx  # Main application (routing, views, API calls)
│   │   ├── App.css  # Application styles
│   │   └── main.jsx # React entry point
│   └── .env.example # Environment variable template
└── server/          # Express.js + Mongoose backend
    ├── src/
    │   ├── app.js        # Express app (middleware, routes)
    │   ├── server.js     # Entry point (DB connect → HTTP listen)
    │   ├── config/db.js  # MongoDB Atlas connection
    │   ├── controllers/  # Request handlers
    │   ├── middleware/    # Auth, role guards, error handling
    │   ├── models/        # Mongoose schemas
    │   └── routes/        # Express routers
    └── .env.example  # Environment variable template
```

## Quick Start

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (free tier works)

### 1. Configure environment variables

**Backend:**
```bash
cp server/.env.example server/.env
# Edit server/.env — fill in MONGO_URI, JWT_SECRET, etc.
```

**Frontend:**
```bash
cp client/.env.example client/.env
# Edit client/.env — set VITE_API_URL=http://localhost:3000
```

### 2. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Start the development servers

**Backend** (in one terminal):
```bash
cd server
npm run dev
```

**Frontend** (in another terminal):
```bash
cd client
npm run dev
```

The frontend runs at http://localhost:5173 and the backend at http://localhost:3000.

## MongoDB Atlas Setup

1. Sign in at https://cloud.mongodb.com
2. Create a free M0 cluster (or use an existing one)
3. Under **Database Access** → Add a database user with **Read and Write** access
4. Under **Network Access** → Add your IP address (or `0.0.0.0/0` for development)
5. Click **Connect** → **Drivers** → select **Node.js** → copy the connection string
6. Replace `<username>`, `<password>`, and `<database-name>` in the string
7. Paste the final string as `MONGO_URI` in `server/.env`

**Example:**
```
MONGO_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/campus?retryWrites=true&w=majority
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/setup-admin` | Initial admin creation |
| GET | `/api/admin/dashboard` | Admin statistics |
| GET/POST | `/api/admin/students` | Student management |
| GET/POST | `/api/admin/teachers` | Teacher management |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (student) |
| GET | `/api/tasks/my` | My tasks |
| GET | `/api/tasks/all` | All tasks (admin) |
| GET/PUT | `/api/invitations/my` | Student invitations |

## User Roles

- **Admin**: Create students/teachers/projects, view all data
- **Teacher**: Mentor projects, create and manage tasks
- **Student**: Create projects, accept invitations, update task status

## First Login

1. Visit the app and click **Setup admin** to create the first admin account
2. Log in as **Admin**
3. Create teacher and student accounts from the admin dashboard
4. Credentials are shown once after account creation — save them securely

## Environment Variables Reference

### Backend (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default: 3000) |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Long random string for JWT signing |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `1d`) |
| `CLIENT_ORIGIN` | No | Frontend URL for CORS (default: `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | No | For file uploads |
| `CLOUDINARY_API_KEY` | No | For file uploads |
| `CLOUDINARY_API_SECRET` | No | For file uploads |

### Frontend (`client/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API URL |

## Security Notes

- Never commit `.env` files — they are excluded by `.gitignore`
- JWT secrets should be at least 64 random characters
- The admin setup endpoint (`/api/auth/setup-admin`) is automatically blocked once any admin exists
- All API error responses in production never expose stack traces
- Rate limiting is applied to all auth endpoints (30 req/15 min per IP)
