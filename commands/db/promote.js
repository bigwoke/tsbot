const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument!')

  let match = await ts.data.collection('users').findOne({ name: args[0] })
  if (!match) return ts.sendTextMessage(client.getID(), 1, 'User with the given name could not be found.')

  let filter = { name: args[0] }
  let update = { $set: { elevated: true } }
  let options = { upsert: true }

  ts.data.collection('users').updateOne(filter, update, options, (err, res) => {
    if (err) log.error('[DB] Error inserting/updating document:', err.stack)

    if (res.result.upserted) {
      ts.sendTextMessage(client.getID(), 1, `Successfully promoted ${args[0]}.`)
      log.info(`[DB] User "${args[0]}" elevated by "${client.nickname} (DBID ${client.databaseId})"`)
    } else {
      if (res.result.n === 0) {
        ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.getID(), 1, `${args[0]} is already an elevated user.`)
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.getID(), 1, 'Successfully elevated user.')
        log.info(`[DB] User "${args[0]}" elevated by "${client.nickname}(DBID ${client.databaseId})"`)
      } else {
        ts.sendTextMessage(client.getID(), 1, 'Issue elevating user.')
      }
    }
  })
}

module.exports.info = {
  name: 'promote',
  usage: `${process.env.PREFIX}promote <name>`,
  desc: 'Sets an existing user in the database to bot mod status.',
  module: 'db',
  level: 0
}
