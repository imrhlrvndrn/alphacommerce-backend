const router = require('express').Router();
const Book = require('../models/books.model');
const { CustomError } = require('../services');
const { errorResponse, successResponse } = require('../utils/errorHandlers');

router.route('/:genre').get(async (req, res, next) => {
    const { genre } = req.params;
    try {
        const returnedBooks = await Book.find({ genres: { $in: [genre] } });
        if (!returnedBooks.length)
            return next(
                CustomError.notFound('404', 'failed', `No books found with ${genre} genre `)
            );

        return successResponse(res, {
            success: true,
            data: {
                books: [...returnedBooks],
            },
            toast: { status: 'success', message: `Fetched books of ${genre} genre` },
        });
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

module.exports = router;
