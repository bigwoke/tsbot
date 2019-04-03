const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  let dateOpts = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short'
  }

  if (!args[0]) {
    getRandomQuote((quote, author) => {
      let date = `[color=#777777](${quote.date.toLocaleString(undefined, dateOpts)})[/color]`
      displayQuote(`#${quote.number} - ${author.name}: "${quote.quote}" ${date}`)
    })
  } else {
    getQuote(args[0], (quote, author) => {
      let date = `[color=#777777](${quote.date.toLocaleString(undefined, dateOpts)})[/color]`
      displayQuote(`#${quote.number} - ${author.name}: "${quote.quote}" ${date}`)
    })
  }

  function displayQuote (output) {
    ts.sendTextMessage(client.getID(), ev.targetmode, output)
  }

  function getRandomQuote (callback) {
    ts.data.collection('quotes').aggregate([{ $sample: { size: 1 } }]).toArray((err, res) => {
      if (err) log.error('[DB] Error getting quote from database:', err.stack)
      let quote = res[0]

      ts.data.collection('users').findOne({ _id: quote.author }, (error, result) => {
        if (error) log.error('[DB] Error getting quote from database:', error.stack)
        let author = result
        if (!result) {
          author = { name: quote.author }
        }
        callback(quote, author)
      })
    })
  }

  function getQuote (searchTerm, callback) {
    let searchInt = Number.isInteger(parseInt(searchTerm))
    if (searchInt) {
      let query = { number: parseInt(searchTerm) }
      ts.data.collection('quotes').findOne(query, (err, res) => {
        if (err) log.error('[DB] Error getting quote from database:', err.stack)

        let quote = res

        ts.data.collection('users').findOne({ _id: res.author }, (error, result) => {
          if (error) log.error('[DB] Error getting quote from database:', error.stack)
          let author = result
          if (!result) {
            author = { name: quote.author }
          }

          callback(quote, author)
        })
      })
    } else {
      ts.data.collection('users').findOne({ name: searchTerm }, (err, res) => {
        if (err) log.error('[DB] Error getting quote from database:', err.stack)
        if (!res) {
          ts.data.collection('quotes').find({ author: searchTerm }).toArray((error, result) => {
            if (error) log.error('[DB] Error getting quote from database:', error.stack)
            if (result.length === 0) {
              return ts.sendTextMessage(client.getID(), 1, 'Could not find quote by that user.')
            }
            let author = { name: searchTerm }
            let quote = result[Math.floor(result.length * Math.random())]
            callback(quote, author)
          })
        } else {
          let author = res

          ts.data.collection('quotes').find({ author: author._id }).toArray((error, result) => {
            if (error) log.error('[DB] Error getting quote from database:', error.stack)
            if (result.length === 0) {
              return ts.sendTextMessage(client.getID(), 1, 'Could not find quote by that user.')
            }

            let quote = result[Math.floor(result.length * Math.random())]
            callback(quote, author)
          })
        }
      })
    }
  }
}

module.exports.info = {
  name: 'quote',
  usage: `${process.env.PREFIX}quote [number | user name]`,
  desc: 'Prints a random quote unless a number is specified.',
  module: 'quote',
  level: 2
}
