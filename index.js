require('dotenv').config();
const cors = require('cors');
const express = require('express');
// const verifyToken = require('./middlewares');
const cookieParser = require('cookie-parser');

const { connectDb } = require('./config/db.config');

// importing middlewares
const { errorHandler } = require('./middlewares');

// importing route handlers
const authRoutes = require('./routes/auth.router');
const cartRoutes = require('./routes/carts.router');
const userRoutes = require('./routes/users.router');
const bookRoutes = require('./routes/books.router');
const genresRoutes = require('./routes/genres.router');
const wishlistRoutes = require('./routes/wishlists.router');

const app = express();
const PORT = process.env.PORT || 4000;

app.set('Access-Control-Allow-Credentials', true);
connectDb();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
// app.use((req, res, next) => {
//     req.user = { id: '' };
//     next();
// });
app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/carts', cartRoutes);
app.use('/users', userRoutes);
app.use('/genres', genresRoutes);
app.use('/wishlists', wishlistRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'Hello everyone' });
});

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
