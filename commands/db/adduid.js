const cfg = require('../../config');
const log = require('../../log.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const match = await ts.data.collection('users').findOne({ name: args[0] });
  if (!match) return ts.sendTextMessage(client.clid, 1, 'Could not find user.');

  const uidRegex = /^.{27}=$/u;

  if (!uidRegex.test(args[1])) {
    return ts.sendTextMessage(client.clid, 1, 'Unique ID does not match the required pattern.');
  }

  async function getAddr (callback) {
    const foundClient = await ts.getClientByUid(args[1]);
    if (foundClient) {
      callback(foundClient.connectionClientIp);
    } else {
      ts.clientDbFind(args[1], true).then(clFind => {
        [clFind] = clFind;
        ts.clientDbInfo(clFind.cldbid).then(cl => {
          [cl] = cl;
          callback(cl.clientLastip);
        });
      });
    }
  }

  getAddr(addr => {
    const filter = { name: args[0] };
    const update = { $addToSet: { uid: args[1], ip: addr } };

    ts.data.collection('users').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error updating document:', err.stack);

      if (res.result.n === 0) {
        ts.sendTextMessage(client.clid, 1, 'Couldn\'t find document, please report this bug.');
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.clid, 1, 'User document already has that ID.');
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.clid, 1, 'Successfully added unique ID.');
        log.info('[DB] Unique ID', args[1], 'added to', args[0]);
      } else {
        ts.sendTextMessage(client.clid, 1, 'Issue adding unique ID.');
      }
    });
  });
};

module.exports.info = {
  name: 'adduid',
  usage: `${cfg.bot.prefix}adduid <name> <unique ID>`,
  desc: 'Adds a unique ID to a user document.',
  module: 'db',
  level: 0
};
