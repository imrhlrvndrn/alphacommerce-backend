const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'Order' },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        stripe: {
            customer_id: { type: String },
            payment_intent_id: { type: String },
        },
        items: [
            {
                book_id: { type: Schema.Types.ObjectId, ref: 'Book' },
                name: { type: String },
                image: { type: String },
            },
        ],
        total: { type: Number, required: true },
        shipping: { type: Object },
        delivery_status: { type: String, default: 'pending' },
        payment_status: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', userSchema);
