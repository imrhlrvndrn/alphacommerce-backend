const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'Cart' },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        data: [
            {
                book: { type: Schema.Types.ObjectId, ref: 'Book' },
                quantity: { type: Number, default: 1 },
                variant: {
                    _id: { type: Schema.Types.ObjectId },
                    type: {
                        type: String,
                        enum: {
                            values: ['ebook', 'hardcover', 'paperback'],
                            message: 'Variant type can only be ebook, hardcover, or paperback',
                        },
                        required: [true, 'Variant type is a required field'],
                    },
                    price: {
                        type: Number,
                        required: [true, 'Please enter the price of the selected variant'],
                    },
                },
                total: { type: Number, default: 0 },
            },
        ],
        checkout: {
            subtotal: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
