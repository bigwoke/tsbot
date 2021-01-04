const log = require('../../log.js');

module.exports.run = async (ts, ev, client, args) => {
  let user = null;
  if (args[0]) {
    user = await ts.data.collection('users').findOne({ name: args[0] })
      .catch(err => log.error('[DB] Error getting user from database:', err));
  }

  const query = user
    ? { author: user._id }
    : {};
  const options = {
    sort: { number: -1 },
    limit: 1,
    projection: { number: 1 }
  };

  const count = await ts.data.collection('quotes').countDocuments(query)
    .catch(err => log.error('[DB] Error getting quote count:', err));
  const { number: max } = await ts.data.collection('quotes').findOne(query, options)
    .catch(err => log.error('[DB] Error getting quote from database:', err));

  const msg = user
    ? `${user.name} has [b]${count}[/b] existing quotes. Their latest quote: #${max}`
    : `There are [b]${count}[/b] total existing quotes. Most recent quote: #${max}`;
  ts.sendTextMessage(client.getID(), ev.targetmode, msg);
};

module.exports.info = {
  name: 'quotecount',
  usage: `${process.env.PREFIX}quotecount [user name]`,
  desc: 'Returns the total number of quotes, optionally by a given user.',
  module: 'quote',
  level: 2
};
