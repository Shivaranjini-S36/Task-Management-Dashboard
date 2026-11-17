# TaskFlow - Task Management Dashboard

A full-stack, responsive **Task Management Dashboard** web application developed for B.Tech Information Technology coursework. The application allows users to monitor task statistics, add new tasks with reminder alerts, update task workflow statuses (`Pending` ➔ `In Progress` ➔ `Completed`), edit existing task details, and delete tasks with real-time updates and permanent database persistence.

---

## 🌐 Live URLs

- **Live Frontend (GitHub Pages):** [https://shivaranjini-s36.github.io/Task-Management-Dashboard/](https://shivaranjini-s36.github.io/Task-Management-Dashboard/)
- **Live Backend API (Render):** `https://task-management-dashboard-backend-w958.onrender.com`
- **GitHub Repository:** [https://github.com/Shivaranjini-S36/Task-Management-Dashboard](https://github.com/Shivaranjini-S36/Task-Management-Dashboard)

---

## 📸 Dashboard Screens & Interface Design

The UI has been built to match the college practical record output:

1. **Dashboard Overview (Screen 1):**
   - Left Navigation Sidebar (`TaskFlow` brand, `Dashboard`, `All Tasks`, `Pending`, `In Progress`, `Completed`, `Task History`).
   - 4 Real-time Stat Cards:
     - **Total Tasks** (All your tasks)
     - **Pending** (Waiting to start)
     - **In Progress** (Currently working)
     - **Completed** (Successfully finished)
   - "All Tasks" header with interactive task search bar.
   - 2-Column Responsive Task Cards showing Task Name, Description, Reminder Date & Time (with amber bell 🔔), Created Date, Status Select Dropdown, and Edit/Delete buttons.

2. **Add New Task Modal (Screen 2):**
   - Centered modal dialog with backdrop blur.
   - Input fields for **Task Name \*** (required validation), **Description** (textarea), and **Reminder Date and Time** (datetime picker).
   - "Cancel" and "Save Task" action buttons.

3. **Status Transitions & Management (Screen 3):**
   - Instant inline status changes using the task card dropdown (`Pending`, `In Progress`, `Completed`).
   - Dynamic counter adjustments on stat cards immediately upon status updates.
   - Edit Task modal to modify existing tasks.
   - Safe delete confirmation modal preventing accidental deletions.
   - Activity History log showing every task event.

---

## 🛠️ Technology Stack

- **Frontend:**
  - Semantic HTML5
  - Modern Responsive CSS3 (Flexbox & CSS Grid, Custom Variables, Transitions)
  - Vanilla JavaScript (ES6+ async/await, Fetch API)
- **Backend:**
  - Node.js (Runtime environment)
  - Express.js (REST API framework)
  - CORS (Cross-Origin Resource Sharing enabled for GitHub Pages)
  - dotenv (Secure environment variables)
- **Database:**
  - MongoDB Atlas (Cloud NoSQL Database)
  - Mongoose (Object Data Modeling)
  - Database: `taskmanagement`
  - Collection: `tasks`

---

## 📁 Project Structure

```text
Task-Management-Dashboard/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages CI/CD deployment
├── config/
│   └── db.js                   # MongoDB Atlas connection handler
├── models/
│   └── Task.js                 # Mongoose schema for Task collection
├── routes/
│   └── taskRoutes.js           # REST API routes (GET, POST, PUT, PATCH, DELETE)
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules for node_modules & secrets
├── .nojekyll                   # GitHub Pages bypass Jekyll processing
├── app.js                      # Frontend application logic & API client
├── config.js                   # API endpoint configuration
├── index.html                  # Main dashboard single-page interface
├── package.json                # Project dependencies and npm scripts
├── README.md                   # Project documentation
├── server.js                   # Express.js server entry point
├── styles.css                  # Custom styling matching practical record
└── test.js                     # Automated API endpoint test suite
```

---

## 🚀 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Shivaranjini-S36/Task-Management-Dashboard.git
cd Task-Management-Dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and configure your MongoDB Atlas connection string:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskmanagement?retryWrites=true&w=majority
DB_NAME=taskmanagement
```

> **Note:** If no MongoDB URI is supplied, the server automatically uses a local fallback storage so you can test all features offline without interruption.

### 4. Run the Server
```bash
npm start
```
The server will start on:
- Dashboard Website: [http://localhost:5000](http://localhost:5000)
- API Health Status: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- API Tasks: [http://localhost:5000/api/tasks](http://localhost:5000/api/tasks)

### 5. Run the Automated Tests
```bash
npm test
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & database connection status |
| `GET` | `/api/tasks` | Retrieve all tasks (supports `?status=` and `?search=`) |
| `GET` | `/api/tasks/stats` | Retrieve task counts (Total, Pending, In Progress, Completed) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/:id` | Retrieve single task by ID |
| `PUT` | `/api/tasks/:id` | Update task name, description, and reminder |
| `PATCH` | `/api/tasks/:id/status` | Update task status (`Pending`, `In Progress`, `Completed`) |
| `DELETE` | `/api/tasks/:id` | Delete task by ID |
| `GET` | `/api/tasks/history/all` | Retrieve task activity history |

---

## ☁️ Deployment Guide

### A. Deploy Backend to Render

1. Sign in to [Render](https://render.com/).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository `Shivaranjini-S36/Task-Management-Dashboard`.
4. Configure the service:
   - **Name:** `task-management-dashboard-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. In **Environment Variables**, add:
   - `MONGODB_URI` = `your_mongodb_atlas_connection_string`
   - `DB_NAME` = `taskmanagement`
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**.
7. Copy your Render web service URL (e.g. `https://task-management-dashboard-backend.onrender.com`).
8. Update `RENDER_BACKEND_URL` in `config.js` with your deployed Render URL.

### B. Deploy Frontend to GitHub Pages

1. In your GitHub repository: `https://github.com/Shivaranjini-S36/Task-Management-Dashboard`.
2. Go to **Settings** ➔ **Pages**.
3. Under **Build and deployment** ➔ **Source**, select **GitHub Actions** (the included `.github/workflows/deploy.yml` will automatically build and publish).
4. Your website will be live at:
   `https://shivaranjini-s36.github.io/Task-Management-Dashboard/`

---

## 📋 Evaluation & Verification Checklist

- [x] Exact visual reproduction of the college practical record screenshots
- [x] Responsive layout across desktop, tablet, and mobile
- [x] Working Add Task form with validation for empty fields
- [x] Full support for `Pending`, `In Progress`, and `Completed` statuses
- [x] Real-time counter updates on stat cards
- [x] Search filter for real-time task queries
- [x] Edit task modal with prefilled data
- [x] Delete task modal with confirmation check
- [x] MongoDB Atlas database connection (`taskmanagement` database, `tasks` collection)
- [x] Express.js REST API with error handling
- [x] Automated test suite verifying all 10 core requirements
- [x] GitHub Pages CI/CD workflow included
- [x] Secure `.env.example` provided with sensitive secrets ignored

---

## 👩‍🎓 Author
**Shivaranjini S**  
B.Tech Information Technology Student  
GitHub: [@Shivaranjini-S36](https://github.com/Shivaranjini-S36)
