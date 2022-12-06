const { CustomError } = require('../services');
const { errorResponse } = require('../utils');

const errorHandler = (err, req, res, next) => {
    let data;

    if (err instanceof CustomError) {
        data = {
            code: err.code,
            status: err.status,
            message: err.message,
        };
    }

    return errorResponse(res, data);
};

module.exports = { errorHandler };
