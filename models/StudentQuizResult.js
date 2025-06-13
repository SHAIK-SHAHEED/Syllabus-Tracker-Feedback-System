const mongoose = require('mongoose');

const studentQuizResultSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Student ID
    score: { type: Number, required: true } // Score achieved by the student
}, { timestamps: true });

module.exports = mongoose.model('StudentQuizResult', studentQuizResultSchema);
