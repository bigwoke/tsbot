const log = require('../../log.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument!');
  const filter = { name: args[0] };

  const user = await ts.data.collection('users').findOne(filter);
  if (user) {
    const groupUpdate = { $pull: { auth_users: user._id } };
    ts.data.collection('groups').updateOne({ auth_users: user._id }, groupUpdate);
    const quotesUpdate = { $set: { author: user.name } };
    ts.data.collection('quotes').updateMany({ author: user._id }, quotesUpdate);
  }

  ts.data.collection('users').deleteOne(filter, (err, res) => {
    if (err) log.error('Error deleting user document:', err.stack);

    if (res.result.n === 1) {
      ts.sendTextMessage(client.clid, 1, 'Successfully removed user document.');
      log.info('[DB] User document removed:', args[0]);
    } else {
      ts.sendTextMessage(client.clid, 1, 'User document with given name could not be found.');
    }
  });
};

module.exports.info = {
  name: 'deluser',
  usage: `${process.env.PREFIX}deluser <name>`,
  desc: 'Removes a user\'s entry from the database.',
  module: 'db',
  level: 0
};
