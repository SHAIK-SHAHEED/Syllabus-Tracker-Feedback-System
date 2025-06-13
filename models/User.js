const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Roll No for Students or Teacher ID
    password: { type: String, required: true }, // Password
    role: { type: String, enum: ['student', 'teacher'], required: true } // User role
});

module.exports = mongoose.model('User', userSchema);
