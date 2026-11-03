# 🎓 Campus Talent Platform

### A full-stack campus project management app with role-based access for Admins, Teachers and Students

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black)

Campus Talent Platform helps a college manage student projects end to end. Admins set up students, teachers and projects. Students create projects and accept invitations. Teachers mentor projects and assign tasks. Every action is protected by role-based access control.

---

## ✨ Features

- 🔐 **JWT authentication** with three roles: Admin, Teacher, Student
- 👨‍💼 **Admin dashboard:** statistics, plus creating and managing students, teachers and projects
- 🎓 **Student workspace:** create projects, accept invitations, update task status
- 👩‍🏫 **Teacher tools:** mentor projects, create and manage tasks
- ✉️ **Invitation system** for adding people to projects
- ✅ **Task tracking** with "my tasks" and admin-wide views
- ☁️ **Optional file uploads** through Cloudinary
- 🛡️ **Security basics:** rate-limited auth endpoints, no stack traces in production errors, and a one-time admin setup

<!--
OPTIONAL: Add screenshots after you take them, then remove these comment lines.

## 🖼️ Screenshots

| Admin Dashboard | Student View |
|---|---|
| ![Admin](screenshots/admin.png) | ![Student](screenshots/student.png) |
-->

---

## 👥 User Roles

| Role | What they can do |
|---|---|
| **Admin** | Create students, teachers and projects. View all data. |
| **Teacher** | Mentor projects. Create and manage tasks. |
| **Student** | Create projects. Accept invitations. Update task status. |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Bootstrap, react-icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas with Mongoose |
| **Auth & Security** | JWT, role-based middleware, rate limiting |
| **File storage** | Cloudinary (optional) |

---

## 📂 Project Structure

```
campus-talent-platform/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx          # Routing, views, API calls
│   │   ├── App.css          # Styles
│   │   └── main.jsx         # React entry point
│   └── .env.example         # Frontend environment template
└── server/                  # Express + Mongoose backend
    ├── src/
    │   ├── app.js           # Express app (middleware, routes)
    │   ├── server.js        # Entry point (DB connect, then listen)
    │   ├── config/db.js     # MongoDB Atlas connection
    │   ├── controllers/     # Request handlers
    │   ├── middleware/      # Auth, role guards, error handling
    │   ├── models/          # Mongoose schemas
    │   └── routes/          # Express routers
    └── .env.example         # Backend environment template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- A free [MongoDB Atlas](https://cloud.mongodb.com) account

### 1. Clone the repository

```bash
git clone https://github.com/Rauneet11/campus-talent-platform.git
cd campus-talent-platform
```

### 2. Set up MongoDB Atlas

1. Sign in at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster (or use an existing one)
3. **Database Access:** add a database user with Read and Write access
4. **Network Access:** add your IP address (or `0.0.0.0/0` for development only)
5. Click **Connect → Drivers → Node.js** and copy the connection string
6. Replace `<username>`, `<password>` and `<database-name>` in the string

Example:

```
MONGO_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/campus?retryWrites=true&w=majority
```

### 3. Configure environment variables

```bash
# Backend
cp server/.env.example server/.env
# Edit server/.env and fill in MONGO_URI, JWT_SECRET, etc.

# Frontend
cp client/.env.example client/.env
# Edit client/.env and set VITE_API_URL=http://localhost:3000
```

### 4. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 5. Run the app

Backend, in one terminal:

```bash
cd server
npm run dev
```

Frontend, in another terminal:

```bash
cd client
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |

---

## 🔑 First Login

1. Open the app and click **Setup admin** to create the first admin account
2. Log in as **Admin**
3. Create teacher and student accounts from the admin dashboard
4. Credentials are shown **once** after account creation, so save them securely

---

## 🔌 API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server health check |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/setup-admin` | Create the initial admin |
| GET | `/api/admin/dashboard` | Admin statistics |
| GET / POST | `/api/admin/students` | Manage students |
| GET / POST | `/api/admin/teachers` | Manage teachers |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create a project (student) |
| GET | `/api/tasks/my` | My tasks |
| GET | `/api/tasks/all` | All tasks (admin) |
| GET / PUT | `/api/invitations/my` | Student invitations |

---

## ⚙️ Environment Variables

### Backend (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Long random string used to sign tokens |
| `PORT` | No | HTTP port (default `3000`) |
| `JWT_EXPIRES_IN` | No | Token expiry (default `1d`) |
| `CLIENT_ORIGIN` | No | Frontend URL for CORS (default `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | No | File uploads |
| `CLOUDINARY_API_KEY` | No | File uploads |
| `CLOUDINARY_API_SECRET` | No | File uploads |

### Frontend (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API URL |

---

## 🔒 Security Notes

- Never commit `.env` files. They are excluded by `.gitignore`.
- Use a `JWT_SECRET` of at least 64 random characters.
- `/api/auth/setup-admin` is blocked automatically once any admin exists.
- In production, API errors never expose stack traces.
- Auth endpoints are rate limited to 30 requests per 15 minutes per IP.
- Restrict MongoDB Network Access to specific IPs in production instead of `0.0.0.0/0`.

---

## 🎯 Roadmap

- [ ] Live demo deployment
- [ ] Automated tests for API routes
- [ ] Email notifications for invitations and task updates
- [ ] Project progress analytics for teachers and admins

---

## 👤 Author

**Rauneet Singh**: MCA student, aspiring data analyst

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/rauneet-/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/Rauneet11)

---

## 📄 License

Released under the [MIT License](LICENSE).
