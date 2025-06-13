const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    answers: { type: [String], required: true },
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
