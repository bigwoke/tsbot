require('dotenv').config();
const TS3 = require('ts3-nodejs-library');
const log = require('winston');
const fs = require('fs');
const actions = require('./actions');
const cfg = require('./config.js');

const prefix = cfg.bot.prefix;
const root_users = cfg.users.root;
const mod_users = cfg.users.mod;

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

const ts = new TS3({
    host: cfg.ts3.host,
    queryport: cfg.ts3.query,
    serverport: cfg.ts3.port,
    username: cfg.ts3.user,
    password: cfg.ts3.pass,
    nickname: cfg.bot.nick
});

ts.commands = new Map();
ts.setMaxListeners(50);

fs.readdir('./commands/', (err, files) => {
    if(err) log.error(err.stack);

    let jsfiles = files.filter(file => file.split('.').pop() === 'js');
    jsfiles.forEach((file, index) => {
        let command = require(`./commands/${file}`);
        let level = command.info.level;

        log.verbose(`${index + 1}: Loaded ${file} ${level===0 ? '(root)' : level===1 ? '(mod)' : ''}`);
        ts.commands.set(command.info.name, command);
    });
    log.info(`Loaded ${jsfiles.length} commands.`);
});

ts.on('ready', async () => {
    ts.whoami()
        .then(bot => {
            let homeCID = cfg.bot.home;
            log.info(`Authorization Successful! Logged in as ${bot.client_nickname}.`);
            ts.clientMove(bot.client_id, homeCID).catch(err => log.warn(err));
        }).catch(err => log.error(err));
    
    //Register for all events within view of SQ client
    await Promise.all([
        ts.registerEvent('server'),
        ts.registerEvent('channel', 0),
        ts.registerEvent('textserver'),
        ts.registerEvent('textchannel'),
        ts.registerEvent('textprivate')
    ]).then(() => {
        log.info('Subscribed to all events.');
    }).catch(err => log.error(err.stack));

    ts.clientList({client_type: 0})
        .then( list => {
            list.forEach( client => {
                actions.sgCheck(client);
            });
        }).catch(err => log.error(err));
});

ts.on('clientconnect', ev => {
    let client = ev.client;
    let nick = client.getCache().client_nickname;

    log.silly(`[+] Client "${nick}" connected.`);

    actions.welcome(client);
    actions.sgCheck(client);
});

ts.on('clientdisconnect', ev => {
    log.silly(`[-] Client "${ev.client.client_nickname}" disconnected.`);
});

ts.on('clientmoved', ev => {
    if(ev.client.getCache().client_type !== 0) return;
    let nick = ev.client.getCache().client_nickname;
    let channel_name = ev.channel.getCache().channel_name;
    log.silly(`[x] Client "${nick}" moved to channel "${channel_name}"`);
});

ts.on('textmessage', ev => {
    const message = ev.msg;
    const client = ev.invoker;

    if(!client || client.isQuery()) return;

    let uid = client.getCache().client_unique_identifier;
    let args = message.split(/\s+/g);
    let fullCommand = args[0];
    args = args.slice(1);

    client.level = root_users.includes(uid) ? 0 : mod_users.includes(uid) ? 1 : 2;

    if(!fullCommand.startsWith(prefix)) return;
    
    let cmd = ts.commands.get(fullCommand.slice(prefix.length));
    let noPerms = function(cmd) {
        ts.sendTextMessage(client.getID(), 1, `You do not have permission to use the ${cmd} command.`);
    };

    if(cmd) {
        if(cmd.info.level === 0 && !client.level === 0) {
            return noPerms(cmd);
        } else if(cmd.info.level === 1 && !(client.level === 1 || client.level === 0)) {
            return noPerms(cmd);
        } else {
            cmd.run(ts, ev, client, args, log);
        }
    }
});

ts.on('error', err => log.error(err));
ts.on('close', ev => log.info('Connection has been closed:', ev));

module.exports.ts = ts;