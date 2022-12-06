const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        entity: { type: String, required: true, default: 'User' },
        full_name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        avatar: {
            url: { type: String },
        },
        address_tags: [{ type: String }],
        addresses: [
            {
                tag: {
                    type: String,
                    default: '',
                },
                receiver_name: { type: String, required: [true, "Please enter receiver's name"] },
                phone_number: {
                    country_code: {
                        type: Number,
                        required: [true, 'Please enter country code'],
                    },
                    primary: {
                        type: Number,
                        max: 10,
                        required: [true, 'Please enter phone number'],
                    },
                    alternate: {
                        type: Number,
                        max: 10,
                    },
                },
                pincode: {
                    type: Number,
                    required: [true, 'Please enter pincode/zipcode'],
                },
                address: {
                    max: 300,
                    type: String,
                    required: [true, 'Please enter address'],
                },
                locality: {
                    max: 200,
                    type: String,
                    required: [true, 'Please enter address'],
                },
                city: {
                    max: 200,
                    type: String,
                    required: [true, 'Please enter address'],
                },
                state: {
                    max: 200,
                    type: String,
                    required: [true, 'Please enter address'],
                },
                country: {
                    max: 200,
                    type: String,
                    required: [true, 'Please enter address'],
                },
                landmark: {
                    max: 200,
                    type: String,
                },
            },
        ],
        cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
        wishlists: [{ type: Schema.Types.ObjectId, ref: 'Wishlist' }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
