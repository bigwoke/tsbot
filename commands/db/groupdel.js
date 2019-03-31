const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument!')

  let filter = { _id: args[0] }

  ts.data.collection('groups').deleteOne(filter, (err, res) => {
    if (err) log.error('Error deleting user document:', err.stack)

    if (res.result.n === 1) {
      ts.sendTextMessage(client.getID(), 1, 'Successfully removed group document.')
      log.info('[DB] Group document removed:', args[0])
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Group document with given id could not be found.')
    }
  })
}

module.exports.info = {
  name: 'groupdel',
  usage: `${process.env.PREFIX}groupdel <id>`,
  desc: 'Removes a group document from the database.',
  module: 'db',
  level: 0
}
