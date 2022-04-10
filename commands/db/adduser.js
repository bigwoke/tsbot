const log = require('../../log.js');
const cfg = require('../../config.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const match = await ts.data.collection('users').findOne({ name: args[0] });
  if (match) return ts.sendTextMessage(client.clid, 1, 'Document already exists.');

  const uidRegex = /^.{27}=$/u;
  const nameRegex = /^[a-z_ ]+$/iu;

  if (!nameRegex.test(args[0])) {
    return ts.sendTextMessage(client.clid, 1, 'Name does not match the required pattern.');
  }

  if (args[1] && !uidRegex.test(args[1])) {
    return ts.sendTextMessage(client.clid, 1, 'Unique ID does not match the required pattern.');
  }

  const userlevel = cfg.users.root.includes(args[1]) ? 0 : 2;

  const filter = { name: args[0] };
  let update = { $set: { level: userlevel, uid: [] } };
  const options = { upsert: true };

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
    if (args[1]) {
      update = { $set: { level: userlevel }, $addToSet: { uid: args[1], ip: addr } };
    }

    ts.data.collection('users').updateOne(filter, update, options, (err, res) => {
      if (err) log.error('[DB] Error inserting/updating document:', err.stack);

      if (res.result.upserted) {
        ts.sendTextMessage(client.clid, 1, 'Successfully inserted user document.');
        log.info('[DB] New user document inserted:', args[0]);
      } else if (res.result.n === 0) {
        ts.sendTextMessage(client.clid, 1, 'Couldn\'t find document, please report this bug.');
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.clid, 1, 'User document already has that value.');
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.clid, 1, 'Successfully updated user document.');
        log.info('[DB] Existing user document updated:', args[0]);
      } else {
        ts.sendTextMessage(client.clid, 1, 'Issue editing document.');
      }
    });
  });
};

module.exports.info = {
  name: 'adduser',
  usage: `${cfg.bot.prefix}adduser <name> <unique ID>`,
  desc: 'Adds a user and their unique ID to the database.',
  module: 'db',
  level: 1
};
