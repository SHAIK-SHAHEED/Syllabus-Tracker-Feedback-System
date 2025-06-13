// app.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const syllabusRoutes = require('./routes/syllabus');
const session = require('express-session');
const bodyParser = require('body-parser');
const ejsMate = require('ejs-mate');

const app = express();



// Database connection
mongoose.connect('mongodb://localhost/syllabusTracker', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// Middleware setup
app.engine('ejs', ejsMate); // Use ejs-mate
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'Shaik@786',
    resave: false,
    saveUninitialized: true,
}));

// Use the syllabus routes
app.use('/syllabus', syllabusRoutes);

// Main route
app.get('/', (req, res) => {
    res.render('index');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
