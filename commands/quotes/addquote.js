const log = require('../../log.js')
const db = require('../../db.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let user = await ts.data.collection('users').findOne({ name: args[0] })
  if (!user) return ts.sendTextMessage(client.getID(), 1, 'That user could not be found.')

  let datePos = args.indexOf('--date')
  let hasDate = datePos !== -1

  let quote = hasDate ? args.slice(1, datePos).join(' ') : args.slice(1).join(' ')
  if (quote.length >= 4096) {
    return ts.sendTextMessage(client.getID(), 1, 'Quote is too long, maximum 4096 characters.')
  }

  let date
  if (hasDate) {
    let dateRaw = args.slice(datePos + 1).join(' ')
    date = new Date(Date.parse(dateRaw))

    if (Number.isNaN(Date.parse(dateRaw))) {
      return ts.sendTextMessage(client.getID(), 1, 'Date given is invalid.')
    }
  } else {
    date = new Date(Date.now())
  }

  db.getNextSequenceValue(ts, 'quotenumber', (err, res) => {
    if (err) log.error('[DB] Error updating counters collection:', err.stack)

    let num = res

    let doc = {
      quote: quote,
      number: num,
      author: user._id,
      date: date
    }

    ts.data.collection('quotes').insertOne(doc, (error, result) => {
      if (error) log.error('[DB] Error inserting quote:', error.stack)

      if (result.result.ok === 1) {
        log.info(`Quote #${num} added by ${client.nickname}`)
        ts.sendTextMessage(client.getID(), 1, `Inserted quote #${num}.`)
      }
    })
  })
}

module.exports.info = {
  name: 'addquote',
  usage: `${process.env.PREFIX}addquote <user> <quote> [--date mm/dd/yyyy [hh:mm [am/pm]]]`,
  desc: 'Adds the given quote by the given user.',
  module: 'quote',
  level: 1
}
