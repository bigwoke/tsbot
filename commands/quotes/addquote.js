const cfg = require('../../config.js');
const log = require('../../log.js');
const db = require('../../db.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const user = await ts.data.collection('users').findOne({ name: args[0] });
  if (!user) return ts.sendTextMessage(client.clid, 1, 'That user could not be found.');

  const datePos = args.indexOf('--date');
  const hasDate = datePos !== -1;

  const quote = hasDate ? args.slice(1, datePos).join(' ') : args.slice(1).join(' ');
  if (quote.length >= 4096) {
    return ts.sendTextMessage(client.clid, 1, 'Quote is too long, maximum 4096 characters.');
  }

  let date = null;
  if (hasDate) {
    const dateRaw = args.slice(datePos + 1).join(' ');
    date = new Date(Date.parse(dateRaw));

    if (Number.isNaN(Date.parse(dateRaw))) {
      return ts.sendTextMessage(client.clid, 1, 'Date given is invalid.');
    }
  } else {
    date = new Date(Date.now());
  }

  db.getNextSequenceValue(ts, 'quotenumber', (err, res) => {
    if (err) log.error('[DB] Error updating counters collection:', err.stack);

    const num = res;

    const doc = {
      quote: quote,
      number: num,
      author: user._id,
      date: date
    };

    ts.data.collection('quotes').insertOne(doc, (error, result) => {
      if (error) log.error('[DB] Error inserting quote:', error.stack);

      if (result.result.ok === 1) {
        log.info(`Quote #${num} added by ${client.nickname}`);
        ts.sendTextMessage(client.clid, 1, `Inserted quote #${num}.`);
      }
    });
  });
};

module.exports.info = {
  name: 'addquote',
  usage: `${cfg.bot.prefix}addquote <user> <quote> [--date mm/dd/yyyy [hh:mm [am/pm]]]`,
  desc: 'Adds the given quote by the given user.',
  module: 'quote',
  level: 1
};
