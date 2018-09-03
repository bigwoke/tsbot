const config = {
    ts3: {
        host: process.env.TS_HOST || 'localhost',
        query: process.env.TS_QUERY || '10011',
        port: process.env.TS_PORT || '9987',
        user: process.env.TS_USER || 'serveradmin',
        pass: process.env.TS_PASS
    },
    bot: {
        nick: process.env.NICKNAME || 'tsbot',
        home: process.env.HOMECID,
        prefix: process.env.PREFIX || '!',
    },
    users: {
        root: process.env.ROOT_USERS.split(/,\s*/g),
        mod: process.env.MOD_USERS.split(/,\s*/g)
    },
    loglevel: 'silly',
    sgprot: {
        6: ['FVPGbDQhHzfxWIBGhcoSvkoxT2Y='],
        9: ['wkykjPwfuKAeWDc94bj5o5MIgrY=']
    },
};

module.exports = config;