const util = require('util');
const { CustomError } = require('../services');
const Orders = require('../models/orders.model');
const Users = require('../models/users.model');
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const { successResponse } = require('../utils/errorHandlers');

const express = require('express');
const Carts = require('../models/carts.model');
const router = express.Router();

router.route('/checkout').post(async (req, res, next) => {
    // Assuming the cart?.data is passed into the order_items
    let {
        order_items,
        user: { id, email, address },
    } = req.body;
    const line_items = order_items.map(({ product_data, unit_amount, quantity }) => ({
        price_data: {
            currency: 'inr',
            product_data,
            unit_amount,
        },
        quantity,
    }));
    order_items = order_items.map(({ product_data }) => ({
        _id: product_data.metadata.book_id,
        name: product_data.name,
        image: product_data.images[0],
    }));
    console.log('line_items =>', util.inspect(line_items, false, null, true));
    let customer;

    try {
        const returned_user = await Users.findOne({ _id: id }).select('stripe_customer_id');
        console.log('user stripe id =>', returned_user);
        console.log('user address => ', address);
        if (!returned_user.stripe_customer_id)
            customer = await stripe.customers.create({
                name: 'Rahul Ravindran',
                email,
                metadata: {
                    user_id: id,
                    order_items: JSON.stringify(order_items),
                    address: JSON.stringify(address),
                },
            });
        else {
            customer = await stripe.customers.update(returned_user.stripe_customer_id, {
                metadata: {
                    user_id: id,
                    order_items: JSON.stringify(order_items),
                    address: JSON.stringify(address),
                },
            });
            console.log('Updated customer data => ', util.inspect(customer, false, null, true));
            customer = { id: returned_user.stripe_customer_id };
        }
    } catch (error) {
        console.error(error);
        return next(CustomError.serverError('Could not retrieve the user'));
    }

    try {
        const session = await stripe.checkout.sessions.create({
            line_items,
            // customer_email: email,
            payment_method_types: ['card'],
            mode: 'payment',
            payment_intent_data: {
                setup_future_usage: 'on_session',
            },
            customer: customer.id,
            success_url: `${process.env.FRONTEND_URL}/orders?checkout_status=completed`,
            cancel_url: `${process.env.FRONTEND_URL}/checkout`,
        });
        if (!session.url)
            return next(
                CustomError.serverError('Could not initiate a checkout session. Please try again')
            );

        return successResponse(res, { data: { redirect_url: session.url } });
    } catch (error) {
        console.error(error);
        return next(CustomError.serverError());
    }
});

const create_order = async (customer, data) => {
    const order_items = JSON.parse(customer.metadata.order_items);
    const address = JSON.parse(customer.metadata.address);

    const returned_user = await Users.findOne({ _id: customer.metadata.user_id });
    if (!returned_user) throw CustomError.notFound('No user found');
    returned_user.stripe_customer_id = customer.id;
    const returned_cart = await Carts.findOne({ _id: returned_user.cart });
    if (!returned_cart) throw CustomError.notFound('No cart found for the user');

    const new_order = new Orders({
        user: customer.metadata.user_id,
        stripe: {
            customer_id: customer.id,
            payment_intent_id: data.payment_intent,
        },
        items: order_items.map(({ _id, name, image }) => ({
            book_id: _id,
            name,
            image,
        })),
        total: data.amount_total / 100,
        shipping: { ...address },
        delivery_status: 'pending',
        payment_status: data.payment_status,
    });

    try {
        const saved_order = await new_order.save();

        // Step 1: Add the order id to the user's orders collection
        returned_user.orders = [...returned_user.orders, saved_order._id];
        // Step 2: Remove the items that are in this order from the user's cart
        returned_cart.data = [];
        await returned_cart.save();
        await returned_user.save();
        return saved_order;
    } catch (error) {
        console.error(error);
        throw CustomError.serverError('Could not save the order');
    }
};

router.route('/webhook').post(express.raw({ type: 'application/json' }), async (req, res, next) => {
    const endpointSecret = process.env.LOCAL_STRIPE_WEBHOOK_SECRET;

    const sig = req.headers['stripe-signature'];

    let event, event_data, event_type;

    // Verifying the Webhook integrity
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        // ! Remove the 2nd condition
        if (event && event.type === 'checkout.session.completed') {
            console.log('Webhook event => ', event);
            event_data = event.data.object;
            event_type = event.type;
        }
    } catch (err) {
        return next(CustomError.badRequest('Webhook Error: Invalid signature'));
    }

    try {
        if (event_type === 'checkout.session.completed') {
            const customer_data = await stripe.customers.retrieve(event_data.customer);
            console.log('customer data => ', customer_data);
            const saved_order = await create_order(customer_data, event_data);
            console.log('saved order details => ', saved_order);
            res.redirect();
        }
    } catch (error) {
        console.error(error);
        return next(CustomError.serverError('The webhook event was interrupted'));
    }
    // Handle the event
    // switch (event.type) {
    //     case 'payment_intent.succeeded':
    //         const paymentIntent = event.data.object;
    //         // Then define and call a function to handle the event payment_intent.succeeded
    //         break;
    //     // ... handle other event types
    //     default:
    //         console.log(`Unhandled event type ${event.type}`);
    // }

    // Return a 200 res to acknowledge receipt of the event
    res.send();
});

module.exports = router;
