const Users = require('../models/users.model');
const { CustomError } = require('../services');
const { alreadyExists, serverError } = require('../services/CustomError');
const { errorResponse, successResponse } = require('../utils/errorHandlers');

const router = require('express').Router();

router.route('/').get(async (req, res, next) => {
    try {
        const returnedUsers = await Users.find({});
        if (!returnedUsers.length) return next(CustomError.notFound('No users found'));

        successResponse(res, {
            success: true,
            data: { user: returnedUsers },
            toast: { status: 'success', message: `Fetched users` },
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.param('user_id', async (req, res, next, user_id) => {
    try {
        const returnedUser = await Users.findOne({ _id: user_id })
            .populate({
                path: 'cart',
                select: ['_id'],
                // populate: {
                //     path: 'data',
                //     populate: { path: 'book' },
                // },
            })
            .populate({
                path: 'wishlists',
                populate: {
                    path: 'data.book',
                },
            });
        if (!returnedUser) throw new CustomError.notFound('No user found!');

        req.user = returnedUser;
        next();
    } catch (error) {
        console.error(error);
        errorResponse(res, { code: +error.code, message: error.message, toast: error.toastStatus });
    }
});

router.route('/:user_id').get(async (req, res) => {
    try {
        res.status(200).json({ success: true, user: req.user._doc });
    } catch (error) {
        console.error(error);
        errorResponse(res, { code: +error.code, message: error.message, toast: error.toastStatus });
    }
});

router.route('/:user_id/address/:action').post(async (req, res, next) => {
    const { action } = req.params;
    switch (action) {
        // * Create a change_default_address function that takes in user.addresses & action
        // * Based on the action the function will perform additional/fewer steps to return
        // * Updated addresses

        case 'all': {
            return successResponse(res, { data: { addresses: req.user.addresses } });
        }

        case 'new': {
            let { address: new_address } = req.body;
            try {
                if (
                    req.user.addresses.findIndex(
                        (address) => address?.receiver_name === new_address.receiver_name
                    ) !== -1
                )
                    return next(
                        CustomError.alreadyExists(
                            `The address for ${new_address.receiver_name} already exists. You can edit the address anytime`
                        )
                    );

                new_address = {
                    receiver_name: new_address.receiver_name,
                    address_line_1: new_address.address_line_1,
                    address_line_2: new_address.address_line_2,
                    pincode: new_address.pincode,
                    state: new_address.state,
                    country: new_address.country,
                    phone_number: { country_code: '+91', primary: +new_address.phone_number },
                    is_default: new_address.is_default,
                };

                if (new_address.is_default) {
                    console.log('is default? => ', new_address.is_default);
                    req.user.addresses = [
                        ...req.user.addresses.map((address) => ({
                            ...address._doc,
                            is_default: false,
                        })),
                        new_address,
                    ];
                } else if (req.user.addresses.length === 0) {
                    console.log('is the first address..');
                    req.user.addresses = [{ ...new_address, is_default: true }];
                } else {
                    console.log('Is banal address');
                    req.user.addresses = [...req.user.addresses, new_address];
                }
                const updated_user = await req.user.save();

                return successResponse(res, {
                    data: {
                        address: updated_user.addresses.filter(
                            (address) => address.receiver_name === new_address.receiver_name
                        )[0],
                    },
                });
            } catch (error) {
                console.error(error);
                next(CustomError.serverError());
            }
            break;
        }

        case 'edit': {
            const { updated_address } = req.body;
            try {
                // Updating the address with valid key pairs
                req.user.addresses = req.user.addresses.map((address) => {
                    return address._id.toString() === updated_address._id.toString()
                        ? // Validating properties to avoid invalid addition of properties
                          Object.keys(address._doc).reduce((acc, key) => {
                              acc[key] =
                                  key in updated_address ? updated_address[key] : address[key];
                              return acc;
                          }, address)
                        : updated_address.is_default
                        ? { ...address._doc, is_default: false }
                        : address;
                });

                const updated_user = await req.user.save();
                return successResponse(res, {
                    data: {
                        address: updated_user.addresses.filter(
                            (address) => address._id.toString() === updated_address._id.toString()
                        )[0],
                    },
                });
            } catch (error) {
                console.error(error);
                return next(CustomError.serverError('Could not update address'));
            }
            break;
        }

        case 'delete': {
            const { address_id } = req.body;
            try {
                if (
                    req.user.addresses.findIndex(
                        (address) => address._id.toString() === address_id.toString()
                    ) === -1
                )
                    return next(CustomError.notFound('This address does not exist'));

                const address_to_delete = req.user.addresses.filter(
                    (address) => address._id.toString() === address_id.toString()
                )[0];
                if (address_to_delete.is_default) {
                    req.user.addresses = req.user.addresses
                        .filter((address) => address._id.toString() !== address_id.toString())
                        .map((address, index) =>
                            index === 0
                                ? { ...address._doc, is_default: true }
                                : { ...address._doc, is_default: false }
                        );
                } else
                    req.user.addresses = req.user.addresses.filter(
                        (address) => address._id.toString() !== address_id.toString()
                    );

                await req.user.save();
                return successResponse(res, {
                    toast: { status: 'success', message: 'Your address was deleted successfully' },
                });
            } catch (error) {
                console.error(error);
                return next(CustomError.serverError('Could not delete the address'));
            }
            break;
        }

        default: {
            return next(CustomError.serverError('Invalid operation type'));
        }
    }
});

module.exports = router;
