const Users = require('../models/users.model');
const { CustomError } = require('../services');
const { successResponse } = require('../utils/errorHandlers');

const router = require('express').Router();

router.param('user_id', async (req, res, next, user_id) => {
    try {
        const returnedUser = await Users.findOne({ _id: user_id }).populate('orders');
        if (!returnedUser) throw new CustomError.notFound('No user found!');

        req.user = returnedUser;
        next();
    } catch (error) {
        console.error(error);
        return next(CustomError.serverError());
    }
});

router.route('/:user_id').get(async (req, res, next) => {
    return successResponse(res, { data: { orders: req.user.orders } });
});

module.exports = router;
