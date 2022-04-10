const cfg = require('../../config');
const log = require('../../log.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  const groupid = parseInt(args[0], 10);

  const match = await ts.data.collection('groups').findOne({ _id: groupid });
  if (match) return ts.sendTextMessage(client.clid, 1, 'Document already exists.');

  const _idRegex = /^\d+$/u;

  if (!_idRegex.test(groupid)) {
    return ts.sendTextMessage(client.clid, 1, 'Given id does not match the required pattern.');
  }

  const group = await ts.getServerGroupByID(groupid);
  if (!group) ts.sendTextMessage(client.clid, 1, 'That servergroup does not exist on the server.');

  const groupName = group.name;

  const insert = {
    _id: groupid,
    name: groupName,
    prot: false,
    auth_users: [],
    auto_users: []
  };

  ts.data.collection('groups').insertOne(insert, (err, res) => {
    if (err) log.error('[DB] Error inserting document:', err.stack);

    if (res.result.n === 0) {
      ts.sendTextMessage(client.clid, 1, 'Group document was not inserted.');
    } else {
      ts.sendTextMessage(client.clid, 1, 'Successfully inserted group document.');
      log.info('[DB] Inserted new group document: group', groupid, groupName);
    }
  });
};

module.exports.info = {
  name: 'addgroup',
  usage: `${cfg.bot.prefix}addgroup <id>`,
  desc: 'Adds a servergroup and its basic properties to the database.',
  module: 'db',
  level: 0
};
