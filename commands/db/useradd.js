const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let match = await ts.data.collection('users').find({ name: args[0] }).toArray()
  if (match.length !== 0) {
    return ts.sendTextMessage(client.getID(), 1, 'Document already exists. Append "--edit" to add UID.')
  }

  let uidRegex = /^.{27}=$/g
  let nameRegex = /^[A-Za-z_ ]+$/g

  if (!nameRegex.test(args[0])) {
    return ts.sendTextMessage(client.getID(), 1, 'error: Name does not match the required pattern.')
  }

  if (!uidRegex.test(args[1])) {
    return ts.sendTextMessage(client.getID(), 1, 'error: Unique ID does not match the required pattern.')
  }

  let filter = { name: args[0] }
  let update = { $set: { uid: args[1] } }
  let options = { upsert: true }

  ts.data.collection('users').updateOne(filter, update, options, (err, res) => {
    if (err) log.error('[DB] Error inserting/updating document:', err.stack)

    if (res.result.upserted) {
      ts.sendTextMessage(client.getID(), 1, 'Successfully inserted user document.')
      log.info('[DB] New user document inserted:', args[0])
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Successfully updated user document.')
      log.info('[DB] Existing user document updated:', args[0])
    }
  })
}

module.exports.info = {
  name: 'useradd',
  usage: `${process.env.PREFIX}useradd <name> <unique ID>`,
  desc: 'Adds a user and their unique ID to the database.',
  module: 'db',
  level: 0
}
