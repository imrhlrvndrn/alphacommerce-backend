const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'Book' },
        name: { type: String, required: [true, 'Please provide the name of the book'] },
        // authors: [{ type: Schema.Types.ObjectId, ref: 'Author' }],
        authors: [{ type: String, required: true }],
        cover_image: {
            url: { type: String, required: [true, 'Please provide a cover image'] },
        },
        summary: {
            excerpt: {
                type: String,
                required: [true, 'Please provide excerpt of atmost 50 characters'],
                max: [100, "The excerpt can't exceed 100 characters"],
            },
            text: {
                type: String,
                required: [true, 'Please provide summary of atmost 100 characters'],
                max: [300, "The summary can't exceed 300 characters"],
            },
        },
        ratings: {
            average: { type: Number, default: 0 },
            reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
            voter_count: { type: Number, default: 0 },
            weekly: {
                voter_count: { type: Number, default: 0 },
                value: { type: Number, default: 0 }, // Based on this value render the BOOK OF THE WEEK
            },
        },
        external_urls: {
            // This will be the Amazon, Flipkart link
            amazon: { type: String, required: [true, 'Please provide an external link to Amazon'] },
        },
        // genre: [{ type: Schema.Types.ObjectId, ref: 'Genre' }], // Only select id & name to be populated
        genres: [{ type: String }],
        pages: {
            type: Number,
            required: [true, 'Please enter number of pages in a book'],
            default: 0,
        },
        payment: {
            currency: { type: String, default: 'INR' },
            coupon_codes: [{ type: Schema.Types.ObjectId, ref: 'CouponCode' }],
            tax: [
                {
                    name: {
                        type: String,
                        required: [true, 'Please provide a name for the tax type'],
                    },
                    percentage: {
                        type: Number,
                        required: [true, 'Please provide a percentage for the tax type'],
                    },
                },
            ],
        },
        variants: [
            {
                type: {
                    type: String,
                    enum: {
                        values: ['ebook', 'hardcover', 'paperback'],
                        message: 'Variant type can only be ebook, hardcover, or paperback',
                    },
                    required: [true, 'Variant type is a required field'],
                },
                stock_count: {
                    type: Number,
                    default: 0,
                    required: [true, 'Please enter the stock_count of the item'],
                },
                price: { type: Number, required: true, default: 0 },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);
