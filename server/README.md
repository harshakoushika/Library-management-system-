# 📚 Library Management System — MERN Stack

A full-stack Library Management System built with MongoDB, Express.js, React.js, and Node.js.

## Features

### User Panel
- Register & Login (JWT Auth)
- Browse & search books
- Issue books with custom duration
- Auto-calculated issue date, return date, fine rate
- View issued books history & fines

### Admin Panel
- Manage books (add, edit, delete)
- View & manage all users
- Track all issued books
- Calculate & update late fines
- Dashboard statistics

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/library-management-system.git
cd library-management-system

# 2. Install all dependencies
npm run install:all

# 3. Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret

cp client/.env.example client/.env
# Edit client/.env with your API URL

# 4. Seed admin user (first time only)
cd server && node seed.js

# 5. Run both server and client
cd ..
npm run dev
```

## Deployment
- **Backend**: [Render.com](https://render.com) — connect GitHub repo, set root to `server/`
- **Frontend**: [Vercel](https://vercel.com) — connect GitHub repo, set root to `client/`
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com) — free M0 tier

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Database | MongoDB Atlas + Mongoose |
| Backend | Node.js + Express.js |
| Frontend | React 18 + Vite |
| Auth | JWT |
| UI | Tailwind CSS |
| Deploy | Render + Vercel |

## API Documentation
See `server/API_DOCS.md` for full endpoint list.
