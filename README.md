#  Charity Volunteer App – Full Stack

A full-stack platform connecting volunteers with charitable missions.  
Organizations can post missions; volunteers can discover, apply, and check in.  
Built with **Node.js + Express + MongoDB** (backend) and **React** (frontend).

---

##  Features

### Backend (API)
- **User Management** – roles (volunteer, organization, admin), validation, timestamps
- **Mission Management** – CRUD, presential (geospatial) / online missions, advanced validations
- **Authentication** – JWT + bcrypt (planned)
- **Testing** – unit tests with `mongodb-memory-server` (no real DB required)
- **Indexes** – partial, geospatial, full-text for fast queries

### Frontend (React)
- **User Authentication** – login / register pages, JWT storage
- **Mission Browsing** – list, filter (category, urgency, location), search
- **Mission Details** – view full description, requirements, apply button
- **Organization Dashboard** – create / edit / manage missions, view applicants
- **Volunteer Dashboard** – track applied missions, upcoming events, check-in QR code
- **Responsive UI** – mobile-friendly design

> ⚠️ *Frontend is under active development – core pages are being built.*

---

##  Tech Stack

| Area            | Technologies                                                            |
|-----------------|-------------------------------------------------------------------------|
| **Backend**     | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt                        |
| **Frontend**    | React, React Router, Axios, Context API / Redux (optional), CSS Modules |
| **Testing**     | Node.js native test runner + `mongodb-memory-server` (backend)          |
| **Dev Tools**   | Nodemon, concurrently, dotenv, Vite (or Create React App)               |

---

## 📁 Project Structure

```
charity-volunteer-app/
├── backend/                  # Node.js + Express
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Mission.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── app.js
│   ├── tests/
│   │   └── unit/
│   ├── .env
│   ├── package.json
│   └── ...
├── frontend/                 # React app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/         # API calls
│   │   ├── context/          # Auth state
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   ├── package.json
│   └── ...
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- MongoDB (local or Atlas) – optional for development, tests run in-memory

### Installation & Setup

#### 1. Clone the repository

```bash
git clone https://github.com/OV-Project/charity-volunteer-app.git
cd charity-volunteer-app
```

#### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

`.env` example (backend):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/charity-volunteer
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

#### 3. Frontend setup

```bash
cd ../client
npm install
cp .env.example .env
```

#### 4. Run both backend & frontend concurrently

From the project root, add the following to your root `package.json`:

```json
"scripts": {
  "dev": "concurrently \"npm run server\" \"npm run client\"",
  "server": "cd server && npm run dev",
  "client": "cd client && npm start"
}
```

Then run:

```bash
npm run dev
```

Or run each separately:

**Backend** (port 5000):

```bash
cd server
npm run dev
```

**Frontend** (port 3000):

```bash
cd client
npm start
```