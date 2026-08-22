# Dayflow HRMS

> **Every workday, perfectly aligned.**

Production-grade Human Resource Management System built for the Odoo × NMIT Bangalore Hackathon 2026.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| File Upload | Cloudinary + multer |
| Charts | Recharts |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- Cloudinary account (free tier)

### Setup

```bash
# Install all dependencies
npm run install:all

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secret, and Cloudinary credentials

# Seed demo data
npm run seed

# Start development (client + server)
npm run dev
```

- **Client:** http://localhost:5173
- **Server:** http://localhost:5000

### Demo Credentials (after seeding)
- **Admin:** hr@dayflow.com / Admin@123
- **Employee:** john.doe@dayflow.com / Employee@123

## Modules

- **Authentication** — JWT-based sign up/sign in with email verification
- **Employee Management** — Profile view/edit, directory, photo upload
- **Attendance** — Check-in/out, daily/weekly views, automated absent marking
- **Leave Management** — Apply, track, approve/reject workflow
- **Payroll** — Read-only for employees, full management for admin
- **Notifications** — Real-time updates for leave decisions, payroll, attendance

## Design System

**Dark Plum** — Premium enterprise SaaS aesthetic. 70% white · 20% charcoal · 10% plum accent.
