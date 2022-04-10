const log = require('../../log.js');
const cfg = require('../../config.js');
const fs = require('fs');
const autogroups = cfg.modules.db ? null : require('../../autogroups.json');

module.exports.run = (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  if (!Number.isInteger(parseInt(args[0], 10))) return ts.sendTextMessage(client.clid, 1, 'First argument is not a group ID.');

  async function addUserDB () {
    const sgid = parseInt(args[0], 10);
    const user = await ts.data.collection('users').findOne({ name: args[1] });
    if (!user) return ts.sendTextMessage(client.clid, 1, 'That user is not registered in the database.');

    const filter = { _id: sgid };
    const update = { $addToSet: { auto_users: user._id } };

    ts.data.collection('groups').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error adding autoassigned user to group:', err.stack);

      if (res.result.n === 0) {
        ts.sendTextMessage(client.clid, 1, 'Could not find specified group.');
      } else if (res.result.nModified === 0) {
        ts.sendTextMessage(client.clid, 1, 'User is already autoassigned to this group.');
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.clid, 1, 'Successfully added autoassign user to group.');
        log.info(`[DB] User ${user.name} added to group ${sgid}`);
      } else {
        ts.sendTextMessage(client.clid, 1, 'Issue authorizing user.');
      }
    });
  }

  async function addUserFile () {
    const [sgid, ip] = args;

    if (!autogroups[ip]) autogroups[ip] = [];
    if (autogroups[ip].includes[sgid]) return ts.sendTextMessage(client.clid, 1, 'That IP address has already been assigned the given server group.');

    const servergroup = await ts.getServerGroupByID(parseInt(sgid, 10));
    if (!servergroup) return ts.sendTextMessage(client.clid, 1, 'No server group with that ID could be found.');

    autogroups[ip].push(sgid);
    fs.writeFile('autogroups.json', JSON.stringify(autogroups, null, 2), err => {
      if (err) log.error(err);
    });

    ts.sendTextMessage(client.clid, 1, `The given IP address has been assigned server group ${sgid}.`);
    log.info(`The IP address ${ip} has been assigned server group ${sgid}.`);
  }

  if (cfg.modules.db) {
    addUserDB();
  } else {
    addUserFile();
  }
};

module.exports.info = {
  name: 'addauto',
  usage: `${cfg.bot.prefix}addauto <sgid> <${cfg.modules.db ? 'user name' : 'ip address'}>`,
  desc: 'Assigns the given server group to an IP address.',
  module: 'autogroups',
  level: 0
};
