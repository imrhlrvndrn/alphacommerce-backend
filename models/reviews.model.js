const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'Review' },
        book: { type: Schema.Types.ObjectId, ref: 'Book' },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
        stats: {
            likes_count: { type: Number },
            dislikes_count: { type: Number },
        },
        rating: { type: Number, required: true },
        // replies: [{ type: Schema.Types.ObjectId, ref: 'Comments' }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
