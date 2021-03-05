/* eslint-disable no-process-env */
const config = {
  ts3: {
    protocol: process.env.TS_PROTO || 'ssh',
    host: process.env.TS_HOST || 'localhost',
    query: process.env.TS_QUERY || '10022',
    port: process.env.TS_PORT || '9987',
    user: process.env.TS_USER || 'serveradmin',
    pass: process.env.TS_PASS
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '27017',
    name: process.env.DB_NAME || 'db',
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    uri: process.env.DB_URI,
    opts: { useNewUrlParser: true, useUnifiedTopology: true }
  },
  bot: {
    nick: process.env.NICKNAME || 'tsbot',
    home: process.env.HOMECID,
    prefix: process.env.PREFIX || '!',
    infoChannel: process.env.INFO_CHANNEL_ID,
    quoteTimeoutModifier: process.env.QUOTE_TIMEOUT_MOD || 6000,
    noMoveWaitTimer: process.env.NOMOVE_WAIT || 200,
    idleTime: parseInt(process.env.IDLE_TIME, 10) || 900,
    idleChannel: parseInt(process.env.IDLE_CHANNEL_ID, 10),
    muteState: parseInt(process.env.IDLE_MUTE_STATE, 10) || 1,
    whitelistBanTime: parseInt(process.env.WHITELIST_BAN_DURATION, 10) || 300
  },
  users: {
    root: process.env.ROOT_USERS.split(/,\s*/gu),
    mod: process.env.MOD_USERS.split(/,\s*/gu)
  },
  modules: {
    db: process.env.DB === 'true',
    welcome: process.env.WELCOME !== 'false',
    sgprot: process.env.SGPROT === 'true',
    autogroups: process.env.AUTOGROUPS === 'true',
    quotes: process.env.QUOTES === 'true',
    enforceMove: process.env.ENFORCE_MOVE === 'true',
    antiafk: process.env.ANTI_AFK === 'true',
    whitelist: process.env.WHITELIST === 'true'
  },
  loglevel: process.env.LOGLEVEL || 'info',
  sgprot: require('./sgprot.json'),
  autogroups: require('./autogroups.json')
};

module.exports = config;
