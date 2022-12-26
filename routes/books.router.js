const router = require('express').Router();
const Books = require('../models/books.model');
// const data = require('../data');
const { errorResponse, successResponse } = require('../utils/errorHandlers');
const { CustomError } = require('../services');

router
    .route('/')
    .get(async (req, res, next) => {
        const { genre = 'horror' } = req.query;
        try {
            const returnedBooks = await Books.find({});
            // if (genre) await returnedBooks.find({ genres: { $in: [genre] } });
            return res.status(200).json({ success: true, books: returnedBooks });
        } catch (error) {
            console.error(error);
            return next(error);
        }
    })
    .post(async (req, res, next) => {
        const { body } = req;
        try {
            const { type } = body;
            switch (type) {
                case 'FETCH_DETAILS': {
                    const { limit, genre } = body;
                    const returnedBooks = await Books.find({ genres: { $in: [genre] } }).limit(
                        limit || 0
                    );
                    if (!returnedBooks.length)
                        return next(CustomError.notFound(`Couldn't find any books`));

                    return successResponse(res, {
                        success: true,
                        data: { books: returnedBooks.map((book) => book._doc) },
                        toast: {
                            status: 'success',
                            message: `Successfully fetched ${limit} books`,
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

router.param('bookId', async (req, res, next, bookId) => {
    try {
        const returnedBook = await Books.findOne({ _id: bookId });
        if (!returnedBook) return next(CustomError.notFound('Book not found!'));

        req.book = returnedBook;
        next();
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

router
    .route('/:bookId')
    .get(async (req, res, next) => {
        try {
            successResponse(res, { success: true, data: { book: { ...req.book._doc } } });
        } catch (error) {
            console.error(error);
            return next(error);
        }
    })
    .post(async (req, res, next) => {
        try {
        } catch (error) {
            console.error(error);
            return next(error);
        }
    });

// router.get('/create', async (req, res, next) => {
//     try {
//         data.forEach(async (book) => {
//             const returnedBook = await Books.findOne({ name: book.name });
//             if (returnedBook) return;

//             const newBook = new Books({
//                 name: book.name,
//                 cover_image: book.cover_image,
//                 summary: {
//                     text: book.summary.text.slice(0, 300),
//                     excerpt: book.summary.text.slice(0, 100),
//                 },
//                 authors: [...book.authors],
//                 genres: [...book.genre],
//                 external_urls: {
//                     amazon: book.link.url.text,
//                 },
//                 payment: {
//                     tax: [{ name: 'GST', percentage: 18 }],
//                 },
//                 variants: [
//                     {
//                         type: 'ebook',
//                         price: book.price.value,
//                     },
//                     {
//                         type: 'hardcover',
//                         price: book.price.value,
//                     },
//                     {
//                         type: 'paperback',
//                         price: book.price.value,
//                     },
//                 ],
//             });

//             const savedBook = await newBook.save();
//             if (!savedBook)
//                 return next(
//                     CustomError.serverError(
//                         'Could not create the book entity. Please try again later'
//                     )
//                 );
//         });
//         res.status(201).json({
//             message:
//                 'Successfully stored all the books in the DB. Click here to check books in DB https://cloud.mongodb.com/v2/607509072e6f9572e9fc6348#metrics/replicaSet/60750a80cfc0d057347cf05f/explorer/AlphaReads/books/find',
//         });
//     } catch (error) {
//         console.error('Error => ', error);
//         return next(error);
//     }
// });

module.exports = router;
