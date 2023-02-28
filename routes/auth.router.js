const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = require('express').Router();
const Users = require('../models/users.model');
const Cart = require('../models/carts.model');
const { errorResponse, successResponse } = require('../utils/errorHandlers');
const { CustomError } = require('../services');

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Check if email exists
        const user = await Users.findOne({
            email: email,
        })
            .populate({
                path: 'cart',
                populate: {
                    path: 'data.book',
                },
            })
            .populate({
                path: 'wishlists',
                populate: {
                    path: 'data',
                },
            });
        if (!user) return next(CustomError.unAuthorized('Invalid credentials'));

        // Check if password is correct
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return next(CustomError.unAuthorized('Invalid credentials'));

        // Create and assign a token
        const token = jwt.sign({ id: user._id }, process.env.TOKEN_SECRET /*{ expiresIn: "24h" }*/);
        res.cookie('token', token, { path: '/', httpOnly: true });
        res.cookie('userId', user._id.toString(), { path: '/' });

        return successResponse(res, {
            success: true,
            data: {
                token,
                user: { ...user._doc, password: null },
            },
            toast: {
                status: 'success',
                message: `Welcome back, ${user?.full_name}`,
            },
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.post('/signup', async (req, res) => {
    const { email, full_name, password, avatar } = req.body;
    try {
        // Check if email exists
        const user = await Users.findOne({
            email: email,
        })
            .populate({
                path: 'cart',
                populate: {
                    path: 'data.book',
                },
            })
            .populate({
                path: 'wishlists',
                populate: {
                    path: 'data',
                },
            });
        if (user)
            return next(
                CustomError.alreadyExists(
                    `${email} is associated with another account. Please use another email`
                )
            );

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newCart = new Cart({
            data: [],
        });

        const newUser = new Users({
            full_name,
            email,
            password: hashedPassword,
            avatar: avatar.url ? avatar : { url: '' },
            cart: newCart._id,
        });

        newCart.user = newUser._id;

        const savedUser = await newUser.save();
        await newCart.save();

        // Create and assign a token
        const token = jwt.sign(
            { id: savedUser._id },
            process.env.TOKEN_SECRET /*{ expiresIn: "24h" }*/
        );
        res.cookie('token', token, { path: '/', httpOnly: true });
        res.cookie('userId', savedUser._id.toString(), { path: '/' });

        return successResponse(res, {
            code: 201,
            success: true,
            data: { token, user: { ...savedUser._doc, password: null } },
            toast: {
                status: 'success',
                message: 'Created new user',
            },
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router.get('/logout', (req, res) => {
    res.cookie('token', 'loggedout');
    res.cookie('userId', 'loggedout');
    return successResponse(res, {
        success: true,
        data: { message: "You're logged out" },
        toast: {
            status: 'success',
            message: "You're logged out",
        },
    });
});

module.exports = router;
