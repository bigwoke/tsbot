const log = require('../../log.js');

module.exports.run = (ts, ev, client) => {
  ts.data.collection('groups').find({}).toArray(async (err, res) => {
    if (err) log.error('[DB] Error fetching all group documents.', err.stack);
    let count = 1;
    let resp = `[U]Group List Page ${count}[/U]:\n`;

    res = res.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    for (let i = 0; i < res.length; i++) {
      const group = res[i];

      if (resp.length >= ts.charLimit - 100) {
        ts.sendTextMessage(client.getID(), 1, resp).catch(e => {
          ts.sendTextMessage(client.getID(), 1, 'error: Too many characters in response.');
          log.error('Error printing long message:', e.stack);
        });

        count++;
        resp = `[U]Group List Page ${count}[/U]:\n`;
      }

      let authUsers = '';
      let autoUsers = '';

      for (let j = 0; j < group.auth_users.length; j++) {
        const id = group.auth_users[j];
        const user = await ts.data.collection('users').findOne({ _id: id });
        if (authUsers) {
          authUsers += `, ${user.name}`;
        } else {
          authUsers = user.name;
        }
      }

      for (let j = 0; j < group.auto_users.length; j++) {
        const id = group.auto_users[j];
        const user = await ts.data.collection('users').findOne({ _id: id });
        if (autoUsers) {
          authUsers += `, ${user.name}`;
        } else {
          autoUsers = user.name;
        }
      }

      resp += `[B]${group.name}[/B] (${group._id}):\tProt: ${group.prot}\tAuth: ${authUsers || 'NONE'}\tAuto: ${autoUsers || 'NONE'}\n`;
    }

    if (res.length === 0) return ts.sendTextMessage(client.getID(), 1, 'No group documents.');
    ts.sendTextMessage(client.getID(), 1, resp).catch(e => {
      if (e.id === 1541) {
        ts.sendTextMessage(client.getID(), 1, 'ERR: Too many characters, please report this bug.');
      }
      log.error('Error printing long message:', e.stack);
    });
  });
};

module.exports.info = {
  name: 'grouplist',
  usage: `${process.env.PREFIX}grouplist`,
  desc: 'Lists groups in the database and their properties.',
  module: 'db',
  level: 1
};
