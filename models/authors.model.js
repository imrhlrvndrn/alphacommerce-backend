const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const authorSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'Author' },
        name: { type: String, required: true },
        books: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
        avatar: {
            url: { type: String },
        },
        ratings: {
            average: { type: Number },
            reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
            voter_count: { type: Number },
            weekly: {
                voter_count: { type: Number },
                value: { type: Number }, // Based on this value render the BOOK OF THE WEEK
            },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Author', authorSchema);
