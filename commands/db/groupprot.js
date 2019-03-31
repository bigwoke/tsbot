const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument!')

  let match = await ts.data.collection('groups').findOne({ _id: args[0] })
  if (!match) return ts.sendTextMessage(client.getID(), 1, 'Document does not exist.')

  let filter = { _id: args[0] }
  let update = { $set: { prot: true } }
  let resp = `Group ${args[0]} protection is now enabled.`

  if (match.prot) {
    update = { $set: { prot: false } }
    resp = `Group ${args[0]} protection is now disabled.`
  }

  ts.data.collection('groups').updateOne(filter, update, (err, res) => {
    if (err) log.error('[DB] Error setting protection status of group:', err.stack)

    ts.sendTextMessage(client.getID(), 1, resp)
    log.info(`[DB] Group ${args[0]} protection is now enabled.`)
  })
}

module.exports.info = {
  name: 'groupprot',
  usage: `${process.env.PREFIX}groupprot <id>`,
  desc: 'Toggles protected status of the given servergroup.',
  module: 'db',
  level: 0
}
