const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[2]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let match = await ts.data.collection('groups').findOne({ _id: args[0] })
  if (!match) return ts.sendTextMessage(client.getID(), 1, 'Document does not exist.')

  if (args[2] !== 'auth' && args[2] !== 'auto') {
    return ts.sendTextMessage(client.getID(), 1, 'Invalid user type.')
  }

  let type = args[2] === 'auth' ? 'auth_users' : 'auto_users'

  let userMatch = await ts.data.collection('users').findOne({ name: args[1] })
  if (!userMatch) return ts.sendTextMessage(client.getID(), 1, 'Client with that name could not be found.')

  let id = userMatch._id

  let filter = { _id: args[0] }
  let update = { $addToSet: { [type]: id } }

  ts.data.collection('groups').updateOne(filter, update, (err, res) => {
    if (err) log.error('[DB] Error updating group users:', err)

    if (res.result.n === 0) {
      ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
    } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
      ts.sendTextMessage(client.getID(), 1, 'User is already an', type, 'member of group.')
    } else if (res.result.nModified === 1) {
      ts.sendTextMessage(client.getID(), 1, `Document successfully edited.`)
      log.info('[DB] User added to group document:', type, args[1])
    } else {
      ts.sendTextMessage(client.getID(), 1, `Issue adding user.`)
    }
  })
}

module.exports.info = {
  name: 'groupadduser',
  usage: `${process.env.PREFIX}groupadduser <groupid> <name> <type (auth | auto)>`,
  desc: 'Adds an authorized or auto-set user to a given server group.',
  module: 'db',
  level: 0
}
