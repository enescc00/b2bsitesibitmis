const ErrorHandler = require('../utils/errorHandler');

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Dahili Sunucu Hatası';

    const logger = require('../utils/logger');

    logger.error({
        statusCode,
        message,
        stack: err.stack,
        name: err.name
    });

    res.status(statusCode).json({
        success: false,
        message: message,
        // Geliştirme ortamındaysak, hatanın yığınını da gönderelim.
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorMiddleware;
