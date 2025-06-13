# 📚 Syllabus and Quiz Management System

A web application built with **Node.js**, **Express**, and **EJS** for managing syllabus, quizzes, results, reviews, and dashboards for teachers and students.

## 📂 Project Structure

- **models/** — Database models (Mongoose)
- **public/** — Static assets
  - **css/** — Stylesheets
  - **js/** — Frontend scripts
- **routes/** — Express routes
- **views/** — EJS templates (frontend UI)
- **app.js** — Main application file
- **hashUsers.js** — Password hashing utility
- **package.json** — Project metadata and dependencies

## ✨ Features

- ✅ User Authentication (Login/Register)
- ✅ Author Management
- ✅ Quiz Creation & Result Tracking
- ✅ Student and Teacher Dashboards
- ✅ Review System with Analytics
- ✅ Progress Visualization Charts
- ✅ EJS-based responsive UI

## 🚀 Installation

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install

**Environment Variables (.env)**
ini
Copy code
PORT=3000
DB_URI=mongodb://localhost:27017/your-db-name
SESSION_SECRET=your-secret

## Run App

```bash
npm start

## 📦 Dependencies

- express
- mongoose
- ejs
- bcrypt
- express-session

## 📌 Folder Highlights

- `models/`: Quiz.js, User.js, Review.js, etc.
- `routes/`: auth.js, syllabus.js
- `views/`: login.ejs, dashboardTeacher.ejs, quizzesList.ejs, etc.
- `public/css/`: chart.css, progressChart.css






