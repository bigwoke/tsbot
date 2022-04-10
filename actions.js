const cfg = require('./config.js');
const tools = require('./tools.js');
const log = require('./log.js');

if (cfg.modules.welcome) log.info('Welcome messages are enabled.');
if (cfg.modules.sgprot) log.info('Server group protection is enabled.');
if (cfg.modules.autogroups) log.info('Client auto group assignment is enabled.');
if (cfg.modules.db) log.info('Database-reliant features are enabled.');
if (cfg.modules.enforceMove) log.info('Strict channel move enforcement is enabled.');
if (cfg.modules.antiafk) log.info('Anti-AFK automoving is enabled.');
if (cfg.modules.whitelist) log.info('Server whitelist is enabled.');

async function sendWelcomeMessage (client, ts) {
  if (!cfg.modules.welcome) return;
  if (!client || client.isQuery()) return;
  const nick = client.nickname;

  const cl = await client.getDBInfo();
  const dateCreated = tools.toDate(cl.clientCreated, 'd');
  const timeCreated = tools.toDate(cl.clientCreated, 't');

  const visitCount = cl.clientTotalconnections.toString();

  let end = visitCount.slice(-1);
  if (end > 3 && end <= 9) end = 0;
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const numSuffix = suffixes[end];

  const bot = await ts.whoami();
  const channel = await ts.getChannelById(bot.clientChannelId);

  let welcome = `Hello [b]${nick}[/b], this is your ${visitCount + numSuffix} visit! `;
  welcome += `We first saw you on ${dateCreated} at ${timeCreated}.\n`;
  welcome += `You can use the command [I]${cfg.bot.prefix}help[/I] to see what you can do, but `;
  welcome += 'I can only see your command if you send a PM, or if we are in the same channel. ';
  welcome += `I currently reside in the channel "${channel.name}."`;

  ts.sendTextMessage(client.clid, 1, welcome);
}

function groupProtectionCheck (client, ts) {
  if (!cfg.modules.sgprot) return;
  const uid = client.uniqueIdentifier;

  const sgProtInterval = setInterval(async () => {
    const cl = await client.getInfo().catch(err => {
      if (err.id === 512) return;
      log.error('Error getting client info:', err.stack);
    });

    if (!cl) {
      clearInterval(sgProtInterval);
      return;
    }

    cl.clientServergroups.forEach(async sgid => {
      if (cfg.modules.db) {
        const user = await ts.data.collection('users').findOne({ uid: uid });
        const group = await ts.data.collection('groups').findOne({ _id: sgid });
        if (!group || !group.prot) return;

        let auth = null;
        if (user) {
          for (let i = 0; i < group.auth_users.length; i++) {
            if (user._id.equals(group.auth_users[i])) {
              auth = true;
              break;
            }
          }
        }

        if (!auth) {
          client.serverGroupDel(sgid);
          client.poke(`The server group [B]${group.name}[/B] is protected!`);
          log.info(`User ${client.nickname} was removed from protected group ${group.name}`);
        }
      } else {
        for (const key in cfg.sgprot) {
          if (key === sgid && !cfg.sgprot[key].includes(uid)) {
            ts.getServerGroupById(sgid).then(serverGroup => {
              client.serverGroupDel(sgid);
              client.poke(`The server group [B]${serverGroup.name}[/B] is protected!`);
              log.info(`User ${client.nickname} was removed from protected group ${serverGroup.name}`);
            });
          }
        }
      }
    });
  }, 4000);

  client.on('clientdisconnect', () => {
    clearInterval(sgProtInterval);
  });
}

async function autoGroupAssign (client, ts) {
  if (!cfg.modules.autogroups) return;

  const clinfo = await client.getInfo();
  const clAddr = clinfo.connectionClientIp;
  const clGroups = clinfo.clientServergroups;

  if (cfg.modules.db) {
    const user = await ts.data.collection('users').findOne({ ip: clAddr });
    const groups = await ts.data.collection('groups').find({ auto_users: { $ne: [] } }).toArray();
    if (!user || groups.length === 0) return;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!clGroups.includes(group._id)) {
        client.serverGroupAdd(group._id);
        log.info(`User ${user.name} was auto-assigned to the group ${group.name}.`);
      }
    }
  } else {
    for (const key in cfg.ipgroups) {
      if (key === clAddr) {
        for (const value in cfg.ipgroups[key]) {
          if (!clGroups.includes(value)) {
            const group = await ts.getServerGroupById(cfg.ipgroups[key][value]);
            client.serverGroupAdd(cfg.ipgroups[key][value].toString());
            log.info(`User ${client.nickname} was added to the group ${group.name} assigned to their IP address.`);
          }
        }
      }
    }
  }
}

const recentMoves = new Map();
function enforceClientMove (ev) {
  const { client: cl, channel: ch, reasonid: type } = ev;
  const uniqueID = cl.uniqueIdentifier;

  if (type === '0' && recentMoves.has(uniqueID)) {
    const recentMove = recentMoves.get(uniqueID);
    log.silly(`Client "${cl.nickname}" seems to be using a no-move addon!`);
    cl.addPerm({ permname: 'b_client_is_sticky', permvalue: 1 }).catch(log.error);
    cl.addPerm({ permname: 'b_client_ignore_sticky', permvalue: 0 }).catch(log.error);
    cl.move(recentMove.toChannel.cid).catch(log.error);
    setTimeout(() => {
      cl.delPerm('b_client_is_sticky').catch(log.error);
      cl.delPerm('b_client_ignore_sticky').catch(log.error);
    }, cfg.bot.noMoveWaitTimer);
  }

  if (type !== 0) {
    const moveTimeout = () => recentMoves.delete(uniqueID);
    recentMoves.set(uniqueID, {
      toChannel: ch,
      timeout: setTimeout(moveTimeout, cfg.bot.noMoveWaitTimer)
    });
  }
}

function idleClientCheck (client) {
  if (!cfg.modules.antiafk) return;
  if (!cfg.bot.idleChannel) {
    log.warn('Environment variable IDLE_CHANNEL_ID not set, anti-AFK disabled.');
    return;
  }

  const idleCheckInterval = setInterval(async () => {
    const cl = await client.getInfo().catch(err => {
      if (err.id === 512) return;
      log.error('Error getting client info:', err);
    });

    if (!cl) {
      clearInterval(idleCheckInterval);
      return;
    }

    if (cl.cid === cfg.bot.idleChannel) return;

    /* eslint-disable-next-line no-mixed-operators */
    const muteState = cl.clientOutputMuted << 1 | cl.clientInputMuted;
    const idle = cl.clientIdleTime >= cfg.bot.idleTime * 1000;

    // If the client is idle, meets mute requirements, and is not in idle channel
    if (idle && muteState >= cfg.bot.muteState && cl.cid !== cfg.bot.idleChannel) {
      client.move(cfg.bot.idleChannel).catch(log.error);
      client.message('You have been moved to an idle channel because you ' +
        `were idle for over ${cfg.bot.idleTime} seconds.`);
    }
  }, 4000);
}

function whitelistCheck (client, ts) {
  if (!cfg.modules.whitelist) return;
  if (!cfg.modules.db) return;

  const client_ip = client.connectionClientIp;
  client.getInfo().then(info => {
    const client_mytsid = info.clientMyteamspeakId;

    const query = {
      $or: [
        { ip: client_ip },
        { mytsid: client_mytsid }
      ]
    };

    ts.data.collection('whitelist').find(query).toArray().then(res => {
      if (res.length === 0) {
        setTimeout(() => client.ban('You are not on the whitelist.', cfg.bot.whitelistBanTime), 10);
      }
    });
  });
}

module.exports = {
  welcome: sendWelcomeMessage,
  sgCheck: groupProtectionCheck,
  autoGroups: autoGroupAssign,
  enforceMove: enforceClientMove,
  idleCheck: idleClientCheck,
  whitelistCheck: whitelistCheck
};
