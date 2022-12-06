const requiresAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return next(CustomError.unAuthorized('Invalid Token. Please login again'));

        // Checks if the available token is valid
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.auth = verified;
        next();
    } catch (error) {
        console.error(error);
        return next(error);
    }
};

module.exports = { requiresAuth };
