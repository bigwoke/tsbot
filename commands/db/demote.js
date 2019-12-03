const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument!')

  let match = await ts.data.collection('users').findOne({ name: args[0] })
  if (!match) return ts.sendTextMessage(client.getID(), 1, 'User with the given name could not be found.')

  if (match.level === 0) {
    return ts.sendTextMessage(client.getID(), 1, 'Cannot modify level of root user.')
  }

  let filter = { name: args[0] }
  let update = { $set: { level: 2 } }

  ts.data.collection('users').updateOne(filter, update, (err, res) => {
    if (err) log.error('[DB] Error inserting/updating document:', err.stack)

    if (res.result.n === 0) {
      ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
    } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
      ts.sendTextMessage(client.getID(), 1, `${args[0]} is not an elevated user.`)
    } else if (res.result.nModified === 1) {
      ts.sendTextMessage(client.getID(), 1, `Successfully demoted ${args[0]}.`)
      log.info(`[DB] User "${args[0]}" demoted by "${client.nickname}" (DBID ${client.databaseId})`)
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Issue demoting user.')
    }
  })
}

module.exports.info = {
  name: 'demote',
  usage: `${process.env.PREFIX}demote <name>`,
  desc: 'Returns the given user to the \'user\' level.',
  module: 'db',
  level: 0
}
