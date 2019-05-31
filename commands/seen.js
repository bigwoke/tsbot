const log = require('../log.js')
const tools = require('../tools.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let searchUser = args.slice(0).join(/\s+/g)
  let results = await ts.clientDBFind(searchUser, false).catch(err => {
    if (err.id === 1281) {
      ts.sendTextMessage(client.getID(), 1, 'No matching clients found in the database.')
    } else {
      log.error(err)
    }
  })

  if (!results) return

  // If the search returns an array of multiple results
  if (Array.isArray(results)) {
    let dbidArray = results.map(user => user.cldbid)
    let resp = `Found ${dbidArray.length} matching clients in the database:\n`
    let count = 0

    // For each element in the array of DBIDs
    dbidArray.forEach(element => {
      ts.clientDBInfo(element)
        .then(user => {
          let lastDate = tools.toDate(user.client_lastconnected, 'd')
          let lastTime = tools.toDate(user.client_lastconnected, 't')
          let userNick = user.client_nickname
          count++

          if (resp.length >= ts.charLimit - 100) {
            ts.sendTextMessage(client.getID(), 1, resp).catch(err => {
              ts.sendTextMessage(client.getID(), 1, 'error: Too many characters in response.')
              log.error('Error printing long message:', err.stack)
            })
            resp = ''
          }

          resp += `\n[B]${userNick}[/B]: Last seen on ${lastDate} at ${lastTime}`
          if (count === dbidArray.length) ts.sendTextMessage(client.getID(), 1, resp)
        }).catch(err => log.error(err))
    })
  } else {
    let cldbid = results.cldbid
    ts.clientDBInfo(cldbid)
      .then(user => {
        let lastDate = tools.toDate(user.client_lastconnected, 'd')
        let lastTime = tools.toDate(user.client_lastconnected, 't')
        let userNick = user.client_nickname

        let resp = 'Found 1 matching client in the database:'
        resp += `\n[B]${userNick}[/B]: Last seen on ${lastDate} at ${lastTime}`

        ts.sendTextMessage(client.getID(), 1, resp)
      }).catch(err => log.error(err))
  }
}

module.exports.info = {
  name: 'seen',
  usage: `${process.env.PREFIX}seen <nickname>`,
  desc: 'Lists the last time any users with the specified nickname were last online.',
  level: 2
}
