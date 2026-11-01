# Campus Talent Platform

This guide explains how to start the frontend and backend, create the first
admin account, and sign in as an existing user.

## Requirements

- Node.js and npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- Cloudinary credentials if you want to use project file uploads

## 1. Configure the backend

Open a terminal in the project folder and install the server dependencies:

```sh
cd server
npm install
```

Create `server/.env` with your own values:

```env
PORT=3000
MONGO_URI=mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173

# Needed for project file uploads; can be left out if uploads are not used.
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Use a MongoDB connection string for a database you can access. For MongoDB
Atlas, allow your current IP address in the cluster's network access settings.
Keep `.env` private; do not publish database passwords, JWT secrets, or
Cloudinary credentials. Review and rotate any credentials in an existing
`server/.env` before sharing or deploying the project.
`CLIENT_ORIGIN` must match the frontend's origin (including protocol and port);
the value above is the default for local Vite development.

Start the backend from the `server` folder:

```sh
npm run dev
```

It listens at `http://localhost:3000`. You can check that it is responding by
opening that address; the backend should return a message that it is running.
Leave this terminal open.
On connecting to MongoDB, the backend removes the obsolete unique student
email index from older database versions; student records do not use email.

## 2. Start the frontend

Open a second terminal in the project folder:

```sh
cd client
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). By
default, the frontend sends API requests to `http://localhost:3000`. If your
backend runs at another address, create `client/.env` with:

```env
VITE_API_URL=http://localhost:3000
```

Restart Vite after changing this setting.

## 3. Create the first admin account (Setup admin)

1. On the app's landing page, select **Setup admin**.
2. Enter a username and password you choose, then select **Create admin**.
3. The app returns to **Login** after the account is created.
4. Sign in using the same username and password.

The username is stored in lowercase and must be 4-20 characters. The password
must be at least 8 characters.

Setup admin is only for the initial admin account: it is rejected once any
admin account already exists in the connected database. It does not provide a
default username or password. If setup reports that an admin already exists,
use that account's credentials in the Login form.

## 4. Sign in (Login)

1. Select **Login**.
2. Select the account type: **Student**, **Teacher**, or **Admin**.
3. Enter the username and password of an existing, active account for that role.
4. Select the matching **Sign in as ...** button.

Student and teacher accounts are created by an admin; there is no separate
student or teacher registration flow. If the selected account type does not
match the credentials, choose the role shown in the error message and sign in
again.

There is no public sign-up form and no built-in demo account. The first user
must be created through **Setup admin**. An admin can then create student and
teacher accounts from their management sections. The generated usernames and
initial passwords are shown after successful account creation. The initial
password format is `<username>@password`; share credentials securely and ask
users to change their passwords.

When creating a student or teacher, an admin can set a login username and
password directly. Usernames must be 4–20 characters and passwords at least
8 characters. If either field is left blank, the credentials are generated
automatically and shown after creation. Admins can later change a username or
set a new password using the account's **Edit** action; leave the new-password
field blank to keep the existing password.

After successful login, the dashboard is selected by the account's role:
admin, student, or teacher. The sidebar navigation is role-specific:

- Admins can open the Dashboard, Students, Teachers, Projects, Tasks, and
  Invitations sections.
- Students can open their Dashboard, My Projects, Project Invitations, and My
  Tasks. The Dashboard shows received project invitations and lets students
  accept or reject pending invitations.
- Teachers can open their Dashboard, My Projects, and Task Management.

On a small screen, select **Menu** to open the navigation drawer. Use
**Logout** at the bottom of the sidebar to end the session.

## 5. Use projects, invitations, and tasks

- Students can create a project and choose a mentor from the teacher list.
- Open a project to invite eligible students. Project owners and admins can
  send invitations; recipients accept or reject them from their dashboard.
- Teachers can create tasks for students who are already members of the project.
  The project owner can invite collaborators before tasks are assigned.
- Teachers and admins can edit or delete tasks. A student can change the status
  only of tasks assigned to them.
- The admin Tasks section shows platform-wide tasks; teacher task management is
  limited to projects they mentor, and students see only their assigned tasks.
- The admin Invitations section provides a status-filtered overview. Students
  can accept or reject their own pending invitations from Project Invitations.
- Project owners and admins can update project details, add a GitHub repository
  link, or archive a project. Archived projects are removed from active lists.
- Project members can create folders and upload files when Cloudinary is
  configured.
- Project owners and authorized admins can review invitations sent for a
  project. Invitation acceptance updates membership and invitation status in a
  MongoDB transaction; MongoDB must run as a replica set (MongoDB Atlas is
  supported) for that operation.
- Teachers mentoring a project and admins can create tasks for its current
  members. The existing `assignedBy` teacher field retains the project mentor;
  `createdByUser` records the actual authenticated creator.

## Troubleshooting

- **Cannot connect to the server:** make sure the backend terminal is running
  and `VITE_API_URL` points to it.
- **Database connection fails:** check `MONGO_URI` and, for Atlas, the network
  access allowlist.
- **Login says the user is not found or the password is invalid:** confirm the
  account was created in the same MongoDB database the backend is using.
- **Login says the account is inactive:** ask an admin to activate it.
- **Setup says an admin already exists:** use the existing admin account; setup
  cannot create another initial admin.
