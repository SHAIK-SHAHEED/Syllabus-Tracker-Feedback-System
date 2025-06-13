

const mongoose = require('mongoose');

const PastReviewSchema = new mongoose.Schema({
    syllabusEntryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'SyllabusEntry'
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    comments: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('PastReview', PastReviewSchema);
