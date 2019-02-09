const config = {
  ts3: {
    protocol: process.env.TS_PROTO || 'ssh',
    host: process.env.TS_HOST || 'localhost',
    query: process.env.TS_QUERY || '10022',
    port: process.env.TS_PORT || '9987',
    user: process.env.TS_USER || 'serveradmin',
    pass: process.env.TS_PASS
  },
  bot: {
    nick: process.env.NICKNAME || 'tsbot',
    home: process.env.HOMECID,
    prefix: process.env.PREFIX || '!'
  },
  users: {
    root: process.env.ROOT_USERS.split(/,\s*/g),
    mod: process.env.MOD_USERS.split(/,\s*/g)
  },
  modules: {
    welcome: process.env.WELCOME !== 'false',
    sgprot: process.env.SGPROT === 'true',
    ipgroups: process.env.IPGROUPS === 'true'
  },
  loglevel: process.env.LOGLEVEL || 'info',
  sgprot: require('./sgprot.json'),
  ipgroups: require('./ipgroups.json')
}

module.exports = config
