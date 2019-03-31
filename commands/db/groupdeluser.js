const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[2]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let match = await ts.data.collection('groups').find({ _id: args[0] }).toArray()
  if (match.length === 0) return ts.sendTextMessage(client.getID(), 1, 'Document does not exist.')

  if (args[1] !== 'auth' && args[1] !== 'auto') {
    return ts.sendTextMessage(client.getID(), 1, 'Invalid user type.')
  }

  let type = args[1] === 'auth' ? 'auth_users' : 'auto_users'

  let filter = { _id: args[0] }
  let update = { $pull: { [type]: args[2] } }

  ts.data.collection('groups').updateOne(filter, update, (err, res) => {
    if (err) log.error('[DB] Error removing group user:', err)

    if (res.result.n === 0) {
      ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
    } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
      ts.sendTextMessage(client.getID(), 1, 'User with that type is not in the given group.')
    } else if (res.result.nModified === 1) {
      ts.sendTextMessage(client.getID(), 1, `Document successfully edited.`)
      log.info('[DB] User removed from group document:', type, args[2])
    } else {
      ts.sendTextMessage(client.getID(), 1, `Issue removing user.`)
    }
  })
}

module.exports.info = {
  name: 'groupdeluser',
  usage: `${process.env.PREFIX}groupdeluser <groupid> <type (auth | auto)> <userdoc _id>`,
  desc: 'Removes a user from a specified position in a group.',
  module: 'db',
  level: 0
}
