/* eslint-disable no-undefined */
const log = require('../../log.js');
const cfg = require('../../config');

const timeouts = new Map();

module.exports.run = (ts, ev, client, args) => {
  function formatQuote (q) {
    const vague = !q.date.getSeconds() && !q.date.getMilliseconds();
    const opts = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    };

    if (vague) {
      opts.second = undefined;

      if (q.date.getMinutes() === 0) {
        opts.minute = undefined;

        if (q.date.getHours() === 0) {
          opts.hour = undefined;
          opts.timeZoneName = undefined;
          opts.month = 'short';

          if (q.date.getDate() === 1) {
            opts.day = undefined;
            opts.month = 'long';
          }
        }
      }
    }

    return opts;
  }

  function displayQuote (output) {
    ts.sendTextMessage(client.getID(), ev.targetmode, output);
  }

  function getRandomQuote (callback) {
    ts.data.collection('quotes').estimatedDocumentCount().then(ct => {
      if (timeouts.size === ct - 1) {
        timeouts.delete(Array.from(timeouts.keys())[0]);
      }

      const pipeline = [
        { $match: { number: { $nin: Array.from(timeouts.keys()) } } },
        { $sample: { size: 1 } }
      ];

      ts.data.collection('quotes').aggregate(pipeline).toArray((err, res) => {
        if (err) log.error('[DB] Error getting quote from database:', err.stack);
        const [quote] = res;

        if (quote) {
          const quoteNumber = quote.number;
          const { author } = quote;
          const timeoutFunc = () => timeouts.delete(quoteNumber);

          timeouts.set(quoteNumber, { authorId: author, timeout: setTimeout(timeoutFunc, ct * 5000) });
        }

        ts.data.collection('users').findOne({ _id: quote.author }, (error, result) => {
          if (error) log.error('[DB] Error getting quote from database:', error.stack);
          let author = result;
          if (!result) {
            author = { name: quote.author };
          }
          callback(quote, author);
        });
      });
    });
  }

  function getQuote (searchTerm, callback) {
    const searchInt = Number.isInteger(parseInt(searchTerm, 10));
    if (searchInt) {
      // Get the quote with the given number
      const query = { number: parseInt(searchTerm, 10) };
      ts.data.collection('quotes').findOne(query, (err, res) => {
        if (err) log.error('[DB] Error getting quote from database:', err.stack);
        if (!res) return ts.sendTextMessage(client.getID(), ev.targetmode, 'Could not find quote.');

        const quote = res;

        ts.data.collection('users').findOne({ _id: res.author }, (error, result) => {
          if (error) log.error('[DB] Error getting quote from database:', error.stack);
          let author = result;
          if (!result) {
            author = { name: quote.author };
          }

          callback(quote, author);
        });
      });
    } else {
      // Try to find a user to look up a quote for using the text input
      ts.data.collection('users').findOne({ name: searchTerm }, (err, res) => {
        if (err) log.error('[DB] Error getting quote from database:', err.stack);
        if (!res) {
          const pipeline = [
            { $match: { $text: { $search: searchTerm } } },
            { $sample: { size: 1 } }
          ];

          // Since a user can't be found with text input, try using it to find a quote
          ts.data.collection('quotes').aggregate(pipeline).toArray().then(r => {
            const [quote] = r;
            if (!quote) {
              const msg = 'Could not find a quote by that user or containing that text.';
              return ts.sendTextMessage(client.getID(), 1, msg);
            }

            // Assuming a quote was found, look up its author, then callback
            ts.data.collection('users').findOne({ _id: quote.author }, (error, result) => {
              if (err) log.error('[DB] Error getting quote from databse:', error.stack);
              callback(quote, result);
            });
          }).catch(e => log.error('[DB] Error getting quote from databse:', e.stack));

          return;
        }

        const author = res;

        const match = { author: author._id };

        // Get a count of all quotes by the given author to determine timeout length
        ts.data.collection('quotes').countDocuments(match).then(ct => {
          const timeoutVals = Array.from(timeouts.values());
          const timeoutsMatchingUser = timeoutVals.filter(v => v.authorId.equals(author._id));

          if (timeoutsMatchingUser.length === ct) {
            (() => {
              for (const to of timeouts) {
                const [key, val] = to;

                if (val.authorId.equals(author._id)) {
                  return timeouts.delete(key);
                }
              }
            })();
          }

          const pipeline = [
            { $match: { $and: [match, { number: { $nin: Array.from(timeouts.keys()) } }] } },
            { $sample: { size: 1 } }
          ];

          // Get quote matching the given author that hasn't been displayed recently
          ts.data.collection('quotes').aggregate(pipeline).toArray((error, result) => {
            if (error) log.error('[DB] Error getting quote from database:', error.stack);
            if (!result[0]) {
              return ts.sendTextMessage(client.getID(), 1, 'Could not find quote by that user.');
            }

            const [quote] = result;

            if (quote) {
              const quoteNumber = quote.number;
              const timeoutFunc = () => timeouts.delete(quoteNumber);
              const qtm = cfg.bot.quoteTimeoutModifier;

              timeouts.set(quoteNumber, { authorId: author._id, timeout: setTimeout(timeoutFunc, ct * qtm) });
            }

            callback(quote, author);
          });
        });
      });
    }
  }

  if (args[0]) {
    getQuote(args[0], (quote, author) => {
      const opts = formatQuote(quote);
      const date = `[color=#777777](${quote.date.toLocaleString(undefined, opts)})[/color]`;
      displayQuote(`#${quote.number} - ${author.name}: "${quote.quote}" ${date}`);
    });
  } else {
    getRandomQuote((quote, author) => {
      const opts = formatQuote(quote);
      const date = `[color=#777777](${quote.date.toLocaleString(undefined, opts)})[/color]`;
      displayQuote(`#${quote.number} - ${author.name}: "${quote.quote}" ${date}`);
    });
  }
};

module.exports.info = {
  name: 'quote',
  usage: `${process.env.PREFIX}quote [number | user name]`,
  desc: 'Prints a random quote unless a number is specified.',
  module: 'quote',
  level: 2
};
