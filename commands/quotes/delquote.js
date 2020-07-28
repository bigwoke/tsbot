const log = require('../../log.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'Missing argument!');
  const num = parseInt(args[0], 10);

  const quote = await ts.data.collection('quotes').findOne({ number: num });
  if (!quote) return ts.sendTextMessage(client.getID(), 1, 'That quote could not be found.');

  ts.data.collection('quotes').deleteOne({ number: num }, (err, res) => {
    if (err) log.error('[DB] Error deleting quote from database:', err.stack);
    if (res.result.ok === 1) {
      log.info(`Quote #${num} deleted from database.`);
      ts.sendTextMessage(client.getID(), 1, `Successfully deleted quote ${num}.`);
    }
  });
};

module.exports.info = {
  name: 'delquote',
  usage: `${process.env.PREFIX}delquote <num>`,
  desc: 'Deletes the given quote from the database.',
  module: 'quote',
  level: 0
};
