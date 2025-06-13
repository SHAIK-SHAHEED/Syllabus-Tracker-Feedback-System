const mongoose = require('mongoose');

// Define the question schema
const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: { type: [mongoose.Schema.Types.Mixed], required: true }, // Options can be of any data type
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true } // Field for the correct answer, can also be of any data type
});

// Define the quiz schema
const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: { type: [questionSchema], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deadline: { type: Date, required: true }
});

// Export the Quiz model
module.exports = mongoose.model('Quiz', quizSchema);
