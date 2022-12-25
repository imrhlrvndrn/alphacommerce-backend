const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'User' },
        stripe_customer_id: { type: String, default: '' },
        full_name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        avatar: {
            url: { type: String },
        },
        addresses: [
            {
                receiver_name: {
                    type: String,
                    required: [true, "Please enter receiver's name"],
                    unique: true,
                },
                phone_number: {
                    country_code: {
                        type: Number,
                        required: [true, 'Please enter country code'],
                        default: '+91',
                    },
                    primary: {
                        type: Number,
                        // max: 10,
                        required: [true, 'Please enter phone number'],
                    },
                },
                address_line_1: {
                    type: String,
                    required: [true, 'Please enter address line 1'],
                },
                address_line_2: {
                    type: String,
                    required: [true, 'Please enter address line 2'],
                },
                state: { type: String, required: [true, 'Please enter state'] },
                pincode: { type: String, required: [true, 'Please enter pincode'] },
                country: { type: String, required: [true, 'Please enter country'] },
                is_default: { type: Boolean, default: false },
            },
        ],
        cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
        orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
        wishlists: [{ type: Schema.Types.ObjectId, ref: 'Wishlist' }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
