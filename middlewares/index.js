const { errorHandler } = require('./error.middleware');
const { requiresAuth } = require('./auth.middleware');

module.exports = { errorHandler, requiresAuth };
