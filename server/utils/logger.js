const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf, json } = format;
const fs = require('fs');
const path = require('path');

// Log dizini oluştur
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  transports: [
    new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logDir, 'combined.log') })
  ]
});

// Geliştirme ortamında renkli console çıktısı
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(colorize(), timestamp(), logFormat)
  }));
}

// Morgan uyumlu stream
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
