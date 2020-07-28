const log = require('../../log.js');

module.exports.run = (ts, ev, client) => {
  ts.data.collection('users').find({}).toArray((err, res) => {
    if (err) log.error('[DB] Error fetching all user documents.', err.stack);
    let count = 1;
    let resp = `[U]User List Page ${count}[/U]:\n`;

    res = res.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    res.forEach(user => {
      if (resp.length >= ts.charLimit - 100) {
        ts.sendTextMessage(client.getID(), 1, resp).catch(e => {
          ts.sendTextMessage(client.getID(), 1, 'error: Too many characters in response.');
          log.error('Error printing long message:', e.stack);
        });

        count++;
        resp = `[U]User List Page ${count}[/U]:\n`;
      }

      const levels = ['Root', 'Elevated', 'User'];
      const level = levels[user.level];

      let uids = '';
      user.uid.forEach(uid => {
        if (uids) {
          uids += `, ${uid}`;
        } else {
          uids = uid;
        }
      });
      resp += `[B]${user.name}[/B]:\tLevel: ${level}\tUID: ${uids || 'NO UID'}\n`;
    });

    if (res.length === 0) return ts.sendTextMessage(client.getID(), 1, 'No user documents.');
    ts.sendTextMessage(client.getID(), 1, resp).catch(e => {
      if (e.id === 1541) {
        ts.sendTextMessage(client.getID(), 1, 'ERR: Too many characters, please report this bug.');
      }
      log.error('Error printing long message:', e.stack);
    });
  });
};

module.exports.info = {
  name: 'userlist',
  usage: `${process.env.PREFIX}userlist`,
  desc: 'Lists users in the database and their UIDs.',
  module: 'db',
  level: 1
};
