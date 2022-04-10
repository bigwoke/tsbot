const cfg = require('../config');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const [searchSGID] = args;
  const targetgroup = await ts.getServerGroupById(searchSGID);
  if (!targetgroup) return ts.sendTextMessage(client.clid, 1, 'Could not find the given server group.');

  const message = args.slice(1).join(' ');

  let members = await targetgroup.clientList();
  members = members.filter(m => m.client_unique_identifier !== 'ServerQuery');

  if (!Array.isArray(members)) {
    const cl = await ts.getClientByUid(members.client_unique_identifier);
    ts.sendTextMessage(cl.clid, 1, `[To group ${targetgroup.name}] from ${client.nickname}: ${message}`);
    ts.sendTextMessage(client.clid, 1, `Sent message to group ${targetgroup.name}.`);
    return;
  }

  members.forEach(async clinfo => {
    const cl = await ts.getClientByUid(clinfo.client_unique_identifier);
    ts.sendTextMessage(cl.clid, 1, `[To group ${targetgroup.name}] from ${client.nickname}: ${message}`);
  });
  ts.sendTextMessage(client.clid, 1, `Sent message to group ${targetgroup.name}.`);
};

module.exports.info = {
  name: 'msggroup',
  usage: `${cfg.bot.prefix}msggroup <sgid> <message>`,
  desc: 'Sends a message to all online users in the group with the given ID.',
  level: 1
};
