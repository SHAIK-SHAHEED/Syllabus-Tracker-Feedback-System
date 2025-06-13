const mongoose = require('mongoose');

const regulationSchema = new mongoose.Schema({
  regulation: { type: String, required: true }
});

module.exports = mongoose.model('Regulation', regulationSchema);
