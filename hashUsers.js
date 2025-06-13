const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/syllabusTracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected...');
    hashPasswords();
}).catch(err => console.log(err));

// Import User model
const User = require('./models/User'); // Adjust the path if necessary

// Function to hash passwords
const hashPasswords = async () => {
    try {
        const users = await User.find(); // Fetch all users

        for (const user of users) {
            // Hash the password
            const hashedPassword = await bcrypt.hash(user.password, 10);
            user.password = hashedPassword; // Update the password with the hashed version
            
            await user.save(); // Save the updated user record
            console.log(`Updated ${user.userId} password.`);
        }
        
        console.log('All passwords hashed successfully.');
        mongoose.connection.close(); // Close the database connection
    } catch (error) {
        console.error('Error hashing passwords:', error);
        mongoose.connection.close(); // Close the connection in case of error
    }
};
