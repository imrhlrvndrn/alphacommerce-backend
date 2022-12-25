const router = require('express').Router();
const { v4 } = require('uuid');
const Carts = require('../models/carts.model');
const { CustomError } = require('../services');
const { getVariantPrice, errorResponse, summation, successResponse } = require('../utils');

router.route('/').post(async (req, res, next) => {
    const { body, cookies } = req;
    try {
        const { select, populate } = body;
        const returnedCart = await Carts.findOne({ user: cookies.userId })
            .select(select || [])
            .populate(populate || '');
        if (!returnedCart) return next(CustomError.notFound('No cart found'));

        return successResponse(res, {
            status: 200,
            success: true,
            data: {
                cart: returnedCart,
            },
            toast: {
                status: 'success',
                message: 'Successfully fetched cart information',
            },
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.param('cartId', async (req, res, next, cartId) => {
    try {
        const { body } = req;
        console.log('Request cart => ', body.cart);
        const { select, populate } = body;
        const returnedCart = body.cart
            ? body.cart
            : await Carts.findById(cartId)
                  .select(select || [])
                  .populate(
                      populate || {
                          path: 'data.book',
                      }
                  );
        if (!returnedCart) return next(CustomError.notFound('No cart found!'));

        req.cart = returnedCart;
        next();
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router
    .route('/:cartId')
    .get(async (req, res, next) => {
        try {
            return res
                .status(200)
                .json({ success: true, data: { cart: req.cart._doc } /*req.cart._doc*/ });
        } catch (error) {
            console.error(error);
            return next(error);
        }
    })
    .post(async (req, res, next) => {
        let {
            body: { type }, // Destructuring for all the cases
        } = req;
        try {
            const { body, cart } = req;
            switch (type) {
                case 'FETCH_DETAILS': {
                    return successResponse(res, {
                        status: 200,
                        success: true,
                        data: {
                            cart: cart._doc,
                        },
                        toast: {
                            status: 'success',
                            message: 'Successfully fetched cart information',
                        },
                    });
                }

                case 'ADD_TO_CART': {
                    const { data, multi } = body;

                    const newCartItems = data.map(({ book, quantity, variant, total }) => ({
                        _id: cart._id === 'guest' ? `${v4()}` : undefined,
                        book: book,
                        quantity: quantity || 1,
                        variant: variant,
                        total: total || getVariantPrice(book.variants, variant.type) * quantity,
                    }));

                    if (!multi) {
                        if (
                            cart.data.findIndex(
                                (item) =>
                                    item.book._id === newCartItems[0].book._id &&
                                    item.variant.type === newCartItems[0].variant.type
                            ) !== -1
                        )
                            return next(
                                CustomError.alreadyExists(`Already exists in cart`, 'warning')
                            );

                        cart.data = [...cart.data, newCartItems[0]];
                    } else {
                        /*
                            const userCart = [
                                {_id:'book1', value: 'book1'},
                                {_id:'book2', value: 'book2'},
                                {_id:'book3', value: 'book3'}
                            ];

                            const guestCart = [
                                {_id:'book1', value: 'bible1'},
                                {_id:'book2', value: 'bible2'},
                            ];
                        */

                        // * @desc If guest cart contains the same cartItem in userCart data then it's updated w/ Guest Cart data
                        const updateGuestCartData = cart.data.map((item) => {
                            const index = newCartItems.findIndex(
                                (cartItem) =>
                                    cartItem.book._id === item.book._id &&
                                    cartItem.variant.type === item.variant.type
                            );
                            return index === -1 ? item : newCartItems[index];
                        });

                        // * @desc filtering guest cart items that doesn't exist in user cart
                        const newGuestCartItems = newCartItems.filter(
                            (item) =>
                                updateGuestCartData.findIndex(
                                    (cartItem) =>
                                        item.book._id === cartItem.book._id &&
                                        item.variant.type === cartItem.variant.type
                                ) === -1
                        );

                        cart.data = [...updateGuestCartData, ...newGuestCartItems];
                    }

                    cart.checkout = {
                        subtotal: summation(cart.data, 'total'),
                        total: summation(cart.data, 'total'),
                    };

                    const savedCart = cart._id === 'guest' ? cart : await cart.save();
                    return successResponse(res, {
                        success: true,
                        data: {
                            checkout: savedCart.checkout,
                            data: multi ? savedCart.data : newCartItems,
                        },
                        toast: {
                            message: `Added ${multi ? '' : newCartItems[0].book.name} to cart`,
                            status: 'success',
                        },
                    });
                }

                case 'REMOVE_FROM_CART': {
                    const { _id, variant } = body;
                    console.log('Req data => ', { _id, variant });

                    const cartItemToBeRemoved = cart.data.find(
                        (item) =>
                            item.book._id.toString() === _id && item.variant.type === variant.type
                    );
                    console.log('Item to be removed => ', cartItemToBeRemoved);
                    if (!cartItemToBeRemoved)
                        return next(
                            CustomError.notFound(`Couldn't find the item in cart`, 'warning')
                        );

                    cart.data = cart.data.filter(
                        (item) =>
                            item.book._id.toString() !== _id ||
                            (item.book._id.toString() === _id && item.variant.type !== variant.type)
                    );
                    cart.checkout = {
                        subtotal: summation(cart.data, 'total'),
                        total: summation(cart.data, 'total'),
                    };

                    const updatedCart = cart._id === 'guest' ? cart : await cart.save();
                    return successResponse(res, {
                        code: 200,
                        success: true,
                        data: {
                            _id,
                            variant,
                            checkout: updatedCart.checkout,
                        },
                        toast: {
                            status: 'success',
                            message: `Removed ${cartItemToBeRemoved.book.name} from cart`,
                        },
                    });
                }

                case 'UPDATE_QUANTITY': {
                    const { _id, variant, inc } = body;
                    let updatedItem = {};

                    cart.data = cart.data.map((item) => {
                        if (
                            item.book._id.toString() === _id &&
                            item.variant.type === variant.type
                        ) {
                            updatedItem = {
                                ...(cart._id === 'guest' ? item : item._doc),
                                quantity: inc ? item.quantity + 1 : item.quantity - 1,
                                total:
                                    (inc ? item.quantity + 1 : item.quantity - 1) *
                                    item.book.variants[
                                        item.book.variants.findIndex(
                                            (item) => item.type === variant.type
                                        )
                                    ].price,
                            };
                            return updatedItem;
                        }
                        return item;
                    });
                    cart.checkout = {
                        subtotal: summation(cart.data, 'total'),
                        total: summation(cart.data, 'total'),
                    };

                    const updatedCart = cart._id === 'guest' ? cart : await cart.save();
                    if (!updatedCart)
                        return next(CustomError.serverError("Couldn't update the cart item"));

                    return successResponse(res, {
                        success: true,
                        data: {
                            _id,
                            updatedItem,
                            checkout: updatedCart.checkout,
                        },
                        toast: {
                            status: 'success',
                            message: `Updated quantity of ${updatedItem.book.name} to ${updatedItem.quantity}`,
                        },
                    });
                }

                case 'UPDATE_VARIANT': {
                    const { cartItemId, bookId, variant } = body;
                    let updatedItem = {};

                    if (
                        cart.data.findIndex(
                            (item) =>
                                item.book._id.toString() === bookId &&
                                item.variant.type === variant.type
                        ) !== -1
                    )
                        return next(CustomError.alreadyExists('Already in cart', 'warning'));

                    cart.data = cart.data.map((item) => {
                        if (item._id.toString() === cartItemId) {
                            updatedItem = {
                                ...(cart._id === 'guest' ? item : item._doc),
                                variant,
                                total:
                                    item.quantity *
                                    item.book.variants[
                                        item.book.variants.findIndex(
                                            (item) => item.type === variant.type
                                        )
                                    ].price,
                            };
                            return updatedItem;
                        }
                        return item;
                    });
                    cart.checkout = {
                        subtotal: summation(cart.data, 'total'),
                        total: summation(cart.data, 'total'),
                    };

                    const updatedCart = cart._id === 'guest' ? cart : await cart.save();
                    if (!updatedCart)
                        return next(CustomError.serverError("Couldn't update the cart item"));

                    return successResponse(res, {
                        success: true,
                        data: {
                            _id: bookId,
                            updatedItem,
                            checkout: updatedCart.checkout,
                        },
                        toast: {
                            status: 'success',
                            message: `Updated variant: ${updatedItem.variant.type}`,
                        },
                    });
                }

                default:
                    return next(CustomError.serverError('Invalid operation type'));
            }
        } catch (error) {
            console.error(error);
            return next(error);
        }
    });

module.exports = router;
