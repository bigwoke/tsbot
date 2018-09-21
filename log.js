const log = require('winston');
const cfg = require('./config.js');

log.configure({
    transports: [
        new (log.transports.File)({
            filename: 'output.log',
            timestamp: true,
            level: 'debug',
            json: false
        }),
        new (log.transports.Console)({
            colorize: true,
            humanReadableUnhandledException: true,
            level: cfg.loglevel
        })
    ]
});

module.exports = log;