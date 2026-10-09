# 🌐 WanderLust — Vacation & Travel Listing Platform

> **Full-Stack MERN/EJS Application** for browsing, listing, and reviewing travel destinations worldwide.

[![Live Demo](https://img.shields.io/badge/Render-Deployed-brightgreen?style=for-the-badge&logo=render)](https://wanderlust-dwivedi.onrender.com)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Public_Repository-blue?style=for-the-badge&logo=github)](https://github.com/dwivedianandnarayan7133/WanderLust)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)

---

## 🚀 Live Render Deployment

- **Live Application URL**: [https://wanderlust-neb3.onrender.com](https://wanderlust-neb3.onrender.com/listings)
- **GitHub Repository**: [https://github.com/dwivedianandnarayan7133/WanderLust](https://github.com/dwivedianandnarayan7133/WanderLust)

---

## ✨ Features

- 🏡 **Listing Management**: View detailed property listings, create new stays, and update or delete existing listings.
- 🔐 **Authentication & Authorization**: Passport.js local strategy authentication for secure user registration, sign-in, and session management.
- ⭐ **Reviews & Ratings**: Leave reviews and star ratings on travel destinations.
- 🔎 **Destination Search**: Search listings by destination, city, or country.
- 📅 **Bookings**: Reserve date ranges, check availability, view or cancel upcoming stays, and receive booking emails.
- ✉️ **Post-stay Follow-up**: Send an email after checkout asking guests to review their stay.
- 📍 **Location Details**: Interactive stay information with pricing and location specifications.
- 🎨 **Modern Responsive UI**: Clean EJS templating powered by Bootstrap and custom styling.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Passport.js, Joi Validation
- **Database**: MongoDB & Mongoose (MongoDB Atlas Cloud Integration)
- **Frontend**: EJS (Embedded JavaScript Templates), EJS-Mate, Bootstrap, CSS3
- **Deployment**: Render (Web Service Infrastructure), Git & GitHub

---

## 📁 Repository Structure (Single Monorepo)

```text
WanderLust/
├── backend/
│   ├── app.js                # Express server configuration, session, and routes
│   ├── controllers/          # Request handlers for listings, reviews, users, and bookings
│   ├── routes/               # Express route definitions
│   ├── middleware/           # Authentication, authorization, validation, and errors
│   ├── models/               # Mongoose schemas (Listing, Review, User, Booking)
│   ├── services/             # SMTP mailer and booking follow-up worker
│   ├── utils/                # Express Error classes and async wrappers
│   ├── init/                 # Sample data and database seed scripts
│   ├── schema.js             # Joi request validation schemas
│   └── package.json          # Backend dependencies
├── frontend/
│   ├── views/                # EJS view templates, layouts, and includes
│   └── public/               # Static CSS, JS, and media assets
├── .env.example              # Environment variable template
├── package.json              # Root build & start scripts for Render deployment
├── render.yaml               # Render Infrastructure-as-Code Blueprint
└── README.md                 # Project documentation
```

---

## 💻 Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/dwivedianandnarayan7133/WanderLust.git
   cd WanderLust
   ```

2. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `backend/` or set environment variables:
   ```env
   ATLASDB_URL=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/wanderlust
   SESSION_SECRET=your_super_secret_key
   PORT=8080
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   SMTP_FROM=bookings@example.com
   ```

4. **Run the Application**:
   ```bash
   npm start
   ```
   Open `http://localhost:8080/listings` in your browser.

   SMTP settings are optional for local browsing and booking. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` to enable confirmation and post-checkout emails. `SMTP_FROM` is optional and defaults to `SMTP_USER`. The follow-up worker checks due bookings every 15 minutes and records successful sends in MongoDB.

---

## ☁️ Deployment on Render

This project includes a `render.yaml` Blueprint and root `package.json` for seamless deployment on **Render**:

1. Connect your GitHub repository `dwivedianandnarayan7133/WanderLust` on [Render](https://dashboard.render.com).
2. Set Build Command: `cd backend && npm install`
3. Set Start Command: `cd backend && node app.js`
4. Set Environment Variables:
   - `ATLASDB_URL`: Your MongoDB Atlas Cloud URI
   - `SESSION_SECRET`: Session secret string
   - `NODE_ENV`: `production`
