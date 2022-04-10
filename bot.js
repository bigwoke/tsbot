require('dotenv').config();
const { TeamSpeak } = require('ts3-nodejs-library');
const fs = require('fs');
const watch = require('node-watch');
const path = require('path');

const actions = require('./actions.js');
const tools = require('./tools.js');
const cfg = require('./config.js');
const log = require('./log.js');
const db = cfg.modules.db ? require('./db.js') : null;

const { prefix } = cfg.bot;
const rootUsers = cfg.users.root;
const modUsers = cfg.users.mod;

function getCommands (ts) {
  tools.getFiles('./commands/').then(files => {
    files = tools.flatArray(files);
    const jsfiles = files.filter(f => f.split('.').pop() === 'js');
  
    let count = 0;
    jsfiles.forEach(file => {
      try {
        const cmd = require(path.resolve(file));
        if (!cmd.info || !cmd.run) {
          return log.warn(`Issue with file ${file}, not loading.`);
        }
        if (cmd.info.module && cfg.modules[cmd.info.module] === false) {
          return log.debug(`Module '${cmd.info.module}' disabled, not loading ${cmd.info.name}.`);
        }
        count++;
  
        const levels = ['(root)', '(mod)', ''];
        const level = `${levels[cmd.info.level]}`;
  
        log.verbose(`${count}: Loaded ${path.relative('./commands/', file)} ${level}`);
        ts.commands.set(cmd.info.name, cmd);
      } catch (err) {
        log.warn(`Issue loading command file ${file}:`, err.stack);
      }
    });
    log.info(`Loaded ${count} commands.`);
  });
}

function watchCommands (ts) {
  watch('./commands/', { filter: /\.js$/u, recursive: true }, (evt, file) => {
    function delRequireCache (f, name) {
      const cmd = name.slice(0, -3);
      ts.commands.delete(cmd);
      delete require.cache[require.resolve(path.resolve(f))];
    }
  
    const fileName = path.basename(file);
    delRequireCache(file, fileName);
  
    fs.access(path.resolve(file), fs.constants.F_OK, (err) => {
      if (err) {
        log.info(`Detected removal of command ${fileName}, unloading.`);
      } else {
        try {
          const cmd = require(path.resolve(file));
  
          if (!cmd.info || !cmd.run) {
            return log.warn(`Issue with detected file: ${fileName}. Not loaded.`);
          }
          if (cfg.modules[cmd.info.module] === false) {
            return log.verbose(`Detected file ${fileName}, but its module is disabled. Not loaded.`);
          }
  
          const levels = ['(root)', '(mod)', ''];
          const level = `${levels[cmd.info.level]}`;
  
          log.info(`Detected and loaded command file ${fileName}. ${level}`);
          ts.commands.set(cmd.info.name, cmd);
        } catch (e) {
          log.warn(`Issue loading command file ${fileName}:`, e.stack);
        }
      }
    });
  });
}

function setUserLastSeen (ts, uniqueId) {
  ts.data.collection('users').findOneAndUpdate(
    { uid: uniqueId },
    { $set: { seen: new Date(Date.now()) } }
  ).catch(err => log.error(`Error setting last seen date: ${err}`));
}

TeamSpeak.connect({
  protocol: cfg.ts3.protocol,
  host: cfg.ts3.host,
  queryport: cfg.ts3.query,
  serverport: cfg.ts3.port,
  username: cfg.ts3.user,
  password: cfg.ts3.pass,
  nickname: cfg.bot.nick
}).then(ts => {
  module.exports = ts;

  if (cfg.modules.db) db.mount(ts);

  ts.commands = new Map();
  ts.setMaxListeners(50);
  ts.version().then(res => {
    if (res.version > '3.8') {
      ts.charLimit = 8192;
    } else {
      ts.charLimit = 1024;
    }
  });

  getCommands(ts);
  watchCommands(ts);

  // Start listeners
  ts.on('ready', async () => {
    ts.whoami()
      .then(bot => {
        log.info(`Authorization Successful! Logged in as ${bot.clientNickname}.`);
        if (cfg.bot.home) {
          const homeCID = cfg.bot.home;
          ts.clientMove(bot.clientId, homeCID).catch(err => log.warn(err));
        }
      }).catch(err => log.error(err));

    ts.clientList({ client_type: 0 })
      .then(list => {
        list.forEach(client => {
          actions.sgCheck(client, ts);
          actions.idleCheck(client);
          actions.whitelistCheck(client, ts);
        });
      }).catch(err => log.error(err));
  });

  ts.on('clientconnect', ev => {
    const { client } = ev;
    const nick = client.nickname;
  
    log.silly(`[+] Client "${nick}" connected.`);
  
    actions.welcome(client, ts);
    actions.sgCheck(client, ts);
    actions.autoGroups(client, ts);
    actions.idleCheck(client);
    actions.whitelistCheck(client, ts);
    setUserLastSeen(ts, ev.client.clientUniqueIdentifier);
  });
  
  ts.on('clientdisconnect', ev => {
    log.silly(`[-] Client "${ev.client.clientNickname}" disconnected.`);
    setUserLastSeen(ts, ev.client.clientUniqueIdentifier);
  });
  
  ts.on('clientmoved', ev => {
    if (cfg.modules.enforceMove) actions.enforceMove(ev);
    // If the client is serverquery and an info channel is set
    if (ev.client.type === 1 && cfg.bot.infoChannel) {
      // If the moved client has the same name as the bot config
      if (ev.client.nickname === cfg.bot.nick) {
        ts.whoami().then(bot => {
          ts.getChannelById(bot.clientChannelId).then(ch => {
            const spacerDesc = `${cfg.bot.nick} is currently located in:\n` +
              `[center]"${ch.name}"[/center]\n[left]${cfg.bot.nick} can ` +
              'be moved by authorized users with the [color=#d58500]' +
              `${cfg.bot.prefix}summon[/color] command.`;
  
            ts.channelEdit(cfg.bot.infoChannel, {
              channel_description: spacerDesc
            }).catch(log.error);
          });
        });
      }
    } else {
      const nick = ev.client.nickname;
      const cname = ev.channel.name;
      log.silly(`[x] Client "${nick}" moved to channel "${cname}"`);
    }
  });
  
  ts.on('textmessage', ev => {
    const message = ev.msg;
    const client = ev.invoker;
    const nick = client.nickname;
  
    if (!client || client.isQuery()) return;
  
    const uid = client.uniqueIdentifier;
    let args = message.split(/\s+/gu);
    const [fullCommand] = args;
    args = args.slice(1);
  
    if (!fullCommand.startsWith(prefix)) return;
  
    function noPerms (cmd) {
      ts.sendTextMessage(client.clid, 1, `You do not have permission to use the ${cmd.info.name} command.`);
    }
  
    function runCommand () {
      const cmd = ts.commands.get(fullCommand.toLowerCase().slice(prefix.length));
      if (cmd) {
        if (cmd.info.level < client.level) {
          return noPerms(cmd);
        }
        cmd.run(ts, ev, client, args);
        log.debug(`Command '${cmd.info.name}' receieved from '${nick}'`);
        log.silly(`Full content of '${cmd.info.name}' (from '${nick}'): ${message}`);
  
      }
    }
  
    if (cfg.modules.db) {
      ts.data.collection('users').findOne({ 'uid': uid }).then(user => {
        if (user) {
          client.level = typeof user.level === 'undefined' ? 2 : user.level;
        } else {
          client.level = 2;
        }
        runCommand();
      });
    } else {
      if (rootUsers.includes(uid)) client.level = 0;
      else if (modUsers.includes(uid)) client.level = 1;
      else client.level = 2;
      runCommand();
    }
  });
  
  ts.on('error', err => {
    if (err.id === 520) {
      log.error('Your serverquery password is either incorrect or not defined.');
    } else {
      log.error(err);
    }
  });
  
  ts.on('close', ev => log.info('Connection has been closed:', ev));
});
