const log = require('../../log.js');
const fs = require('fs');
const cfg = require('../../config.js');
const autogroups = cfg.modules.db ? null : require('../../autogroups.json');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  if (cfg.modules.db) {
    const sgid = parseInt(args[0], 10);
    const user = await ts.data.collection('users').findOne({ name: args[1] });
    if (!user) return ts.sendTextMessage(client.clid, 1, 'That user is not registered in the database.');

    const filter = { _id: sgid };
    const update = { $pull: { auto_users: user._id } };

    ts.data.collection('groups').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error removing autoassigned user from group:', err.stack);

      if (res.result.n === 0) {
        ts.sendTextMessage(client.clid, 1, 'Could not find specified group.');
      } else if (res.result.nModified === 0) {
        ts.sendTextMessage(client.clid, 1, 'User is not autoassigned to this group.');
      } else {
        ts.sendTextMessage(client.clid, 1, 'Successfully removed autoassign user from group.');
        log.info(`[DB] User ${user.name} removed from group ${sgid}`);
      }
    });
  } else {
    const [sgid, ip] = args;

    if (!autogroups[ip]) return ts.sendTextMessage(client.clid, 1, 'There are no groups assigned to that IP address.');
    if (!autogroups[ip].includes(sgid)) return ts.sendTextMessage(client.clid, 1, 'That IP address is not currently assigned the given server group.');

    for (const value in autogroups[ip]) {
      if (autogroups[ip][value] === sgid) {
        autogroups[ip].splice(value, 1);
      }
    }

    if (!autogroups[ip].length) delete autogroups[ip];

    fs.writeFile('autogroups.json', JSON.stringify(autogroups, null, 2), err => {
      if (err) log.error(err);
    });

    ts.sendTextMessage(client.clid, 1, `The server group ${sgid} is no longer assigned to IP ${ip}.`);
    log.info(`The server group ${sgid} has been removed from assignment to IP ${ip}.`);
  }
};

module.exports.info = {
  name: 'delauto',
  usage: `${process.env.PREFIX}delauto <sgid> <${cfg.modules.db ? 'user name' : 'ip address'}>`,
  desc: 'Removes a server group id from assignment to the given IP address.',
  module: 'autogroups',
  level: 0
};
