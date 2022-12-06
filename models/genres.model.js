const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const genreSchema = new Schema({
    entity: { type: String, required: true, default: 'Genre' },
    books: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
    name: { type: String, required: true },
});

module.exports = mongoose.model('Genre', genreSchema);
