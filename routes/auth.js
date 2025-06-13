const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model

// Middleware to check if user is authenticated
const { isAuthenticated } = require('../middleware/auth'); // Adjust the path as necessary

// Student Dashboard Route
router.get('/student', isAuthenticated, async (req, res) => {
    try {
        // Fetch user details (if necessary)
        const user = await User.findById(req.user._id); // Assuming you are using _id for the user

        // Ensure user exists
        if (!user) {
            return res.redirect('/login'); // Redirect to login if user is not found
        }

        res.render('dashboardStudent', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Teacher Dashboard Route
router.get('/teacher', isAuthenticated, async (req, res) => {
    try {
        // Fetch user details (if necessary)
        const user = await User.findById(req.user._id); // Assuming you are using _id for the user

        // Ensure user exists
        if (!user) {
            return res.redirect('/login'); // Redirect to login if user is not found
        }

        res.render('dashboardTeacher', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
