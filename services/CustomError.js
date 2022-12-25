class CustomError extends Error {
    constructor(code, status, message) {
        super();
        this.code = code;
        this.status = status;
        this.message = message;
    }

    static alreadyExists(errorMessage = 'Resource already exists', status = 'failed') {
        return new CustomError(209, status, errorMessage);
    }

    static notFound(errorMessage = 'Resource not found', status = 'failed') {
        return new CustomError(404, status, errorMessage);
    }

    static unAuthorized(errorMessage = `You're not authorized`) {
        return new CustomError(401, 'failed', errorMessage);
    }

    static badRequest(errorMessage = `Bad request`) {
        return new CustomError(400, 'failed', errorMessage);
    }

    static serverError(errorMessage = `Internal server error`) {
        return new CustomError(500, 'failed', errorMessage);
    }
}

module.exports = CustomError;
