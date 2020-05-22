const log = require('../../log.js')

const timeouts = new Map()

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) {
    getRandomQuote((quote, author) => {
      let opts = formatQuote(quote)
      let date = `[color=#777777](${quote.date.toLocaleString(undefined, opts)})[/color]`
      displayQuote(`#${quote.number} - ${author.name}: "${quote.quote}" ${date}`)
    })
  } else {
    getQuote(args[0], (quote, author) => {
      let opts = formatQuote(quote)
      let date = `[color=#777777](${quote.date.toLocaleString(undefined, opts)})[/color]`
      displayQuote(`#${quote.number} - ${author.name}: "${quote.quote}" ${date}`)
    })
  }

  function formatQuote (q) {
    let vague = !q.date.getSeconds() && !q.date.getMilliseconds()
    let opts = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    }

    if (vague) {
      opts.second = undefined

      if (q.date.getMinutes() === 0) {
        opts.minute = undefined

        if (q.date.getHours() === 0) {
          opts.hour = undefined
          opts.timeZoneName = undefined
          opts.month = 'short'

          if (q.date.getDate() === 1) {
            opts.day = undefined
            opts.month = 'long'
          }
        }
      }
    }

    return opts
  }

  function displayQuote (output) {
    ts.sendTextMessage(client.getID(), ev.targetmode, output)
  }

  function getRandomQuote (callback) {
    ts.data.collection('quotes').estimatedDocumentCount().then(ct => {
      if (timeouts.size === ct - 1) {
        timeouts.delete(Array.from(timeouts.keys())[0])
      }

      const pipeline = [
        { $match: { number: { $nin: Array.from(timeouts.keys()) } } },
        { $sample: { size: 1 } }
      ]

      ts.data.collection('quotes').aggregate(pipeline).toArray((err, res) => {
        if (err) log.error('[DB] Error getting quote from database:', err.stack)
        let quote = res[0]
  
        if (quote) {
          const quoteNumber = quote.number
          const timeoutFunc = () => timeouts.delete(quoteNumber)
  
          timeouts.set(quoteNumber, { author: author, timeout: setTimeout(timeoutFunc, ct * 5000) })
        }
  
        ts.data.collection('users').findOne({ _id: quote.author }, (error, result) => {
          if (error) log.error('[DB] Error getting quote from database:', error.stack)
          let author = result
          if (!result) {
            author = { name: quote.author }
          }
          callback(quote, author)
        })
      })
    })
  }

  function getQuote (searchTerm, callback) {
    let searchInt = Number.isInteger(parseInt(searchTerm))
    if (searchInt) {
      let query = { number: parseInt(searchTerm) }
      ts.data.collection('quotes').findOne(query, (err, res) => {
        if (err) log.error('[DB] Error getting quote from database:', err.stack)
        if (!res) return ts.sendTextMessage(client.getID(), ev.targetmode, 'Could not find quote.')

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
          return ts.sendTextMessage(client.getID(), 1, 'Could not find that user.')
        }

        let author = res

        const match = { author: author._id }

        const pipeline = [
          { $match: { $and: [match, { number: { $nin: Array.from(timeouts.keys()) } }] } },
          { $sample: { size: 1 } }
        ]

        ts.data.collection('quotes').countDocuments(match).then(async ct => {
          const timeoutVals = Array.from(timeouts.values())
          const timeoutsMatchingUser = timeoutVals.filter(v => v.author._id.equals(author._id))
          
          console.log(timeoutsMatchingUser.length, ct)
          if (timeoutsMatchingUser.length === ct - 1) {
            (() => {
              for (const to of timeouts) {
                let key = to[0]
                let val = to[1]
  
                if (val.author._id.equals(author._id)) {
                  console.log(key)
                  return timeouts.delete(key)
                }
              }
            })() // IIFE IS VERY UGLY BUT WORKS
          }

          ts.data.collection('quotes').aggregate(pipeline).toArray((error, result) => {
            if (error) log.error('[DB] Error getting quote from database:', error.stack)
            if (!result[0]) {
              return ts.sendTextMessage(client.getID(), 1, 'Could not find quote by that user.')
            }

            const quote = result[0]
            
            if (quote) {
              const quoteNumber = quote.number
              const timeoutFunc = () => timeouts.delete(quoteNumber)
      
              timeouts.set(quoteNumber, { author: author, timeout: setTimeout(timeoutFunc, ct * 5000) })
            }

            callback(quote, author);
          })
        })          
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
