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
        console.log('User => ', req.user);

        res.status(200).json({ success: true, user: req.user._doc });
    } catch (error) {
        console.error(error);
        errorResponse(res, { code: +error.code, message: error.message, toast: error.toastStatus });
    }
});

router.route('/:user_id/address/:action').post(async (req, res, next) => {
    const { action } = req.params;
    switch (action) {
        // case 'edit': {
        //     const { updated_address } = req.body;
        //     req.user.addresses = req.user.addresses.map((address) =>
        //         address._id === updated_address._id ? updated_address : address
        //     );

        //     await req.user.save();

        //     return successResponse(res, { data: { address: updated_address } });
        // }

        case 'all': {
            return successResponse(res, { data: { addresses: req.user.addresses } });
        }

        case 'new': {
            let { address: new_address } = req.body;
            try {
                new_address = {
                    receiver_name: new_address.full_name,
                    address_line_1: new_address.address_line_1,
                    address_line_2: new_address.address_line_2,
                    pincode: new_address.pincode,
                    state: new_address.state,
                    country: new_address.country,
                    phone_number: { country_code: '+91', primary: +new_address.phone_number },
                    is_default:
                        req.user.addresses.length <= 1 || new_address.is_default ? true : false,
                };
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

                req.user.addresses = [...req.user.addresses, new_address];
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
                req.user.addresses = req.user.addresses.filter(
                    (address) => address._id.toString() !== address_id.toString()
                );

                const updated_user = await req.user.save();
                return successResponse(res, {
                    toast: { message: 'Your address was deleted successfully' },
                });
            } catch (error) {
                console.error(error);
                return next(CustomError.serverError('Could not delete the address'));
            }
        }

        case 'change_default': {
            const { address_id } = req.body;
            try {
                req.user.addresses = req.user.addresses.map((address) =>
                    address._id.toString() === address_id
                        ? { ...address._doc, is_default: true }
                        : { ...address._doc, is_default: false }
                );

                await req.user.save();
                return successResponse(res, { toast: { message: 'Default address changed' } });
            } catch (error) {
                console.error(error);
                return next(CustomError.serverError('Could not change the default address'));
            }
        }

        default: {
            return next(CustomError.serverError('Invalid operation type'));
        }
    }
});

module.exports = router;
