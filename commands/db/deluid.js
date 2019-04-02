const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let filter = { name: args[0] }
  let update = { $pull: { uid: args[1] } }
  if (args[1] === '*') {
    update = { $set: { uid: [] } }
  }

  ts.data.collection('users').updateOne(filter, update, (err, res) => {
    if (err) log.error('Error removing unique ID:', err.stack)

    if (res.result.n === 0) {
      ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
    } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
      ts.sendTextMessage(client.getID(), 1, 'User document does not have that ID.')
    } else if (res.result.nModified === 1) {
      ts.sendTextMessage(client.getID(), 1, 'Successfully removed unique ID.')
      log.info('[DB] Unique ID', args[1], 'removed from', args[0])
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Issue removing unique ID.')
    }
  })
}

module.exports.info = {
  name: 'deluid',
  usage: `${process.env.PREFIX}deluid <name> <unique ID>`,
  desc: 'Removes a unique ID from a user document.',
  module: 'db',
  level: 0
}
