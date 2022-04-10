const tools = require('../../tools.js');
const cfg = require('../../config.js');
const autogroups = cfg.modules.db ? null : require('../../autogroups.json');

module.exports.run = (ts, ev, client) => {

  async function userAutoListDB () {
    let msg = 'The following users are auto-assigned to these server groups:\n';
    const groups = await ts.data.collection('groups').find({ auto_users: { $exists: true, $ne: [] } }).toArray();
    if (groups.length === 0) return ts.sendTextMessage(client.clid, 1, 'No auto-assigned users.');

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      msg += `Group [B]${group._id}[/B]:\t`;

      for (let j = 0; j < group.auto_users.length; j++) {
        const userID = group.auto_users[j];
        const user = await ts.data.collection('users').findOne({ _id: userID });

        msg += `${j === 0 ? '' : ', '}${user.name}`;
      }
    }
    ts.sendTextMessage(client.clid, 1, msg);
  }

  async function userAutoListFile () {
    if (tools.isEmpty(autogroups)) return ts.sendTextMessage(client.clid, 1, 'No server groups are assigned to any IP addresses.');

    let msg = 'The following IP addresses are assigned to these server groups:\n';

    for (const key in autogroups) {
      msg += `IP [b]${key}[/b]:\t`;

      for (const value in autogroups[key]) { //eslint-disable-line
        const group = await ts.getServerGroupById(autogroups[key][value].toString());
        const groupName = group.name;

        msg += `${parseInt(value, 10) === 0 ? '' : ', '}${groupName} (${autogroups[key][value]})`;
        if (value === autogroups[key].length) msg += '\n';
      }
    }
    ts.sendTextMessage(client.clid, 1, msg);
  }

  if (cfg.modules.db) {
    userAutoListDB();
  } else {
    userAutoListFile();
  }
};

module.exports.info = {
  name: 'autolist',
  usage: `${cfg.bot.prefix}autolist`,
  desc: 'Lists all IP addresses with groups assigned to them.',
  module: 'autogroups',
  level: 1
};
