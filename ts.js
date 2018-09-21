const TS3 = require('ts3-nodejs-library');
const cfg = require('./config.js');

const ts = new TS3({
    host: cfg.ts3.host,
    queryport: cfg.ts3.query,
    serverport: cfg.ts3.port,
    username: cfg.ts3.user,
    password: cfg.ts3.pass,
    nickname: cfg.bot.nick
});

module.exports = ts;