const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let filter = { name: args[0] }
  let update = { $set: { uid: [] } }

  ts.data.collection('users').updateOne(filter, update, (err, res) => {
    if (err) log.error('Error clearing user document:', err.stack)

    if (res.result.n === 1) {
      ts.sendTextMessage(client.getID(), 1, 'Successfully cleared user document.')
      log.info('[DB] User document UIDs cleared:', args[0])
    } else {
      ts.sendTextMessage(client.getID(), 1, 'User document with given name could not be found.')
    }
  })
}

module.exports.info = {
  name: 'userclear',
  usage: `${process.env.PREFIX}userclear <name>`,
  desc: 'Clears all UIDs from a user document without deleting the document.',
  module: 'db',
  level: 0
}
