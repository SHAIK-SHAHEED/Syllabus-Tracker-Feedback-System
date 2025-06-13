const mongoose = require('mongoose');

const SyllabusEntrySchema = new mongoose.Schema({
    regulation: {
        type: String,
        required: true,
    },
    topicName: {
        type: String,
        required: true,
    },
    dateCovered: {
        type: Date,
        required: true,
    },
    timeSpent: {
        type: Number,
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId, // Ensure this is ObjectId
        required: true,
        ref: 'User', // Reference to the User model
    },
    presentStudents: [{
        type: mongoose.Schema.Types.ObjectId, // Ensure this is ObjectId
        ref: 'User', // Reference to the User model
    }]
}, { timestamps: true });

const SyllabusEntry = mongoose.model('SyllabusEntry', SyllabusEntrySchema);
module.exports = SyllabusEntry;
