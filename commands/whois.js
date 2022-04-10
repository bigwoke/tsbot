const tools = require('../tools.js');
const cfg = require('../config.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const [searchUID] = args;
  const [targetDBID] = await ts.clientDbFind(searchUID, true);
  const [target] = await ts.clientDbInfo(targetDBID.cldbid);

  if (!target) return ts.sendTextMessage(client.clid, 1, 'Cannot find the client with that unique ID!');

  let resp = `Who is the client with UID "${searchUID}"?\n`;
  const targetNick = target.clientNickname;
  let targetLevel = 'User';
  if (cfg.users.root.includes(searchUID)) targetLevel = 'Root';
  else if (cfg.users.mod.includes(searchUID)) targetLevel = 'Elevated';
  const targetLastSeen = tools.toDate(target.clientLastconnected);
  resp += `Nickname: ${targetNick}\nDBID: ${targetDBID.cldbid}\nPermission Level: ${targetLevel}\nLast Seen: ${targetLastSeen}`;
  ts.sendTextMessage(client.clid, 1, resp);
};

module.exports.info = {
  name: 'whois',
  usage: `${cfg.bot.prefix}whois <uniqueid>`,
  desc: 'Returns basic information about the client with the given unique ID.',
  level: 2
};
