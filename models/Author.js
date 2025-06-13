const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
    regulation: { type: String, required: true }, // Add regulation field
    topic: { type: String, required: true },
    authorName: { type: String, required: true },
    bookName: { type: String, required: true }
});

const Author = mongoose.model('Author', authorSchema);

module.exports = Author;
