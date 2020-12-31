const cfg = require('./config.js');
const tools = require('./tools.js');
const log = require('./log.js');

if (cfg.modules.welcome) log.info('Welcome messages are enabled.');
if (cfg.modules.sgprot) log.info('Server group protection is enabled.');
if (cfg.modules.autogroups) log.info('Client auto group assignment is enabled.');
if (cfg.modules.db) log.info('Database-reliant features are enabled.');
if (cfg.modules.enforceMove) log.info('Strict channel move enforcement is enabled.');

async function sendWelcomeMessage (client, ts) {
  if (!cfg.modules.welcome) return;
  if (!client || client.isQuery()) return;
  const nick = client.nickname;

  const [cl] = await ts.clientDBInfo(client.databaseId);
  const dateCreated = tools.toDate(cl.client_created, 'd');
  const timeCreated = tools.toDate(cl.client_created, 't');

  const visitCount = cl.client_totalconnections.toString();

  let end = visitCount.slice(-1);
  if (end > 3 && end <= 9) end = 0;
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const numSuffix = suffixes[end];

  const bot = await ts.whoami();
  const channel = await ts.getChannelByID(bot.client_channel_id);

  let welcome = `Hello [b]${nick}[/b], this is your ${visitCount + numSuffix} visit! `;
  welcome += `We first saw you on ${dateCreated} at ${timeCreated}.\n`;
  welcome += `You can use the command [I]${cfg.bot.prefix}help[/I] to see what you can do, but `;
  welcome += 'I can only see your command if you send a PM, or if we are in the same channel. ';
  welcome += `I currently reside in the channel "${channel.name}."`;

  ts.sendTextMessage(client.getID(), 1, welcome);
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

    cl.client_servergroups.forEach(async sgid => {
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
          if (parseInt(key, 10) === sgid && !cfg.sgprot[key].includes(uid)) {
            ts.getServerGroupByID(sgid).then(serverGroup => {
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
  const clAddr = clinfo.connection_client_ip;
  const clGroups = clinfo.client_servergroups;

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
            const group = await ts.getServerGroupByID(cfg.ipgroups[key][value]);
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

  if (type === 0 && recentMoves.has(uniqueID)) {
    const recentMove = recentMoves.get(uniqueID);
    log.silly(`Client "${cl.nickname}" seems to be using a no-move addon!`);
    cl.addPerm('b_client_is_sticky', 1).catch(log.error);
    cl.move(recentMove.toChannel.cid).catch(log.error);
    setTimeout(() => {
      cl.delPerm('b_client_is_sticky').catch(log.error);
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

module.exports = {
  welcome: sendWelcomeMessage,
  sgCheck: groupProtectionCheck,
  autoGroups: autoGroupAssign,
  enforceMove: enforceClientMove
};
