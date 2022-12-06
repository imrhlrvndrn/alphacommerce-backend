const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'Wishlist' },
        name: {
            name: { type: String, required: [true, 'Please provide a name for the Wishlist'] },
            duplicate_count: {
                type: Number,
                required: [true, 'Provide initial duplicate count'],
                default: 0,
            },
        },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        data: [{ book: { type: Schema.Types.ObjectId, ref: 'Book' } }],
        estimated_price: { type: Number },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
