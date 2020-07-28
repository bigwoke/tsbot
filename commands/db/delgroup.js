const log = require('../../log.js');

module.exports.run = (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument!');
  const groupid = parseInt(args[0], 10);

  const filter = { _id: groupid };

  ts.data.collection('groups').deleteOne(filter, (err, res) => {
    if (err) log.error('Error deleting user document:', err.stack);

    if (res.result.n === 1) {
      ts.sendTextMessage(client.getID(), 1, 'Successfully removed group document.');
      log.info('[DB] Group document removed:', groupid);
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Group document with given id could not be found.');
    }
  });
};

module.exports.info = {
  name: 'delgroup',
  usage: `${process.env.PREFIX}delgroup <id>`,
  desc: 'Removes a group document from the database.',
  module: 'db',
  level: 0
};
