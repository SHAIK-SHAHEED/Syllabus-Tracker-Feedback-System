const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    studentId: { type: String, required: true }, // Change to String if you want to keep student IDs as strings
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Make sure this is ObjectId
    message: { type: String, required: true },
    syllabusEntryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SyllabusEntry', required: true },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
