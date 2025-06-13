// models/Syllabus.js
const mongoose = require('mongoose');

// Define the schema for the Syllabus
const syllabusSchema = new mongoose.Schema({
    class: { type: String, required: true }, // Class level (e.g., B.Tech)
    semester: { type: String, required: true }, // Semester (e.g., Semester 1)
    subject: { type: String, required: true }, // Subject name (e.g., Artificial Intelligence)
    units: [
        {
            unitName: { type: String, required: true }, // Name of the unit
            topics: [
                {
                    topicName: { type: String, required: true }, // Name of the topic
                    dateCovered: { type: Date, default: null }, // Date covered (optional)
                    timeSpent: { type: Number, default: 0 } // Time spent on the topic (optional)
                }
            ]
        }
    ]
});

// Export the Syllabus model
module.exports = mongoose.model('Syllabus', syllabusSchema);
