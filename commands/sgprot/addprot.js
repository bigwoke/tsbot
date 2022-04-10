const log = require('../../log.js');
const cfg = require('../../config.js');
const fs = require('fs');
const sgprot = cfg.modules.db ? null : require('../../sgprot.json');

module.exports.run = (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  if (!Number.isInteger(parseInt(args[0], 10))) return ts.sendTextMessage(client.clid, 1, 'First argument is not a group ID.');

  async function addUserDB () {
    const sgid = parseInt(args[0], 10);
    const userDBName = args[1]; // eslint-disable-line prefer-destructuring

    const groupMatch = await ts.data.collection('groups').findOne({ _id: sgid });
    const userMatch = await ts.data.collection('users').findOne({ name: userDBName });

    if (!groupMatch) return ts.sendTextMessage(client.clid, 1, 'That group is not registered in the database.');
    if (!userMatch) return ts.sendTextMessage(client.clid, 1, 'That user is not registered in the database.');

    const filter = { _id: sgid };
    const update = { $addToSet: { auth_users: userMatch._id } };

    ts.data.collection('groups').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error updating auth_users in group document:', err.stack);

      if (res.result.n === 0) {
        ts.sendTextMessage(client.clid, 1, 'Could not find specified group.');
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.clid, 1, 'That user is already authorized.');
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.clid, 1, `Successfully authorized ${userDBName}.`);
        log.info(`[DB] Added ${userDBName} to auth_users in group ${sgid}.`);
      } else {
        ts.sendTextMessage(client.clid, 1, 'Issue authorizing user.');
      }
    });
  }

  async function addUserFile () {
    const sgid = parseInt(args[0], 10);
    const uid = args[1]; // eslint-disable-line prefer-destructuring

    if (!sgprot[sgid]) sgprot[sgid] = [];
    if (sgprot[sgid].includes(uid)) return ts.sendTextMessage(client.clid, 1, 'That client is already an allowed member of the given group.');

    const servergroup = await ts.getServerGroupByID(parseInt(sgid, 10));
    if (!servergroup) return ts.sendTextMessage(client.clid, 1, 'No server group with that ID could be found.');

    sgprot[sgid].push(uid);
    fs.writeFile('sgprot.json', JSON.stringify(sgprot, null, 2), err => {
      if (err) log.error(err);
    });

    ts.sendTextMessage(client.clid, 1, `If ${uid} is a correct uid, that user is now an allowed member of group ${sgid}.`);
    log.info(`Root user has manually added ${uid} as an allowed member of protected group with ID ${sgid}`);
  }

  if (cfg.modules.db) {
    addUserDB();
  } else {
    addUserFile();
  }
};

module.exports.info = {
  name: 'addprot',
  usage: `${cfg.bot.prefix}addprot <sgid> <${cfg.modules.db ? 'user name' : 'uniqueid'}>`,
  desc: 'Adds the given user to the protected list for the given server group.',
  module: 'sgprot',
  level: 0
};
