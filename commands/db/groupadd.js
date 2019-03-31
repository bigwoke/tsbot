const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let match = await ts.data.collection('groups').findOne({ _id: args[0] }).toArray()
  if (match) return ts.sendTextMessage(client.getID(), 1, 'Document already exists.')

  let _idRegex = /^\d+$/

  if (!_idRegex.test(args[0])) {
    return ts.sendTextMessage(client.getID(), 1, 'Given id does not match the required pattern.')
  }

  let group = await ts.getServerGroupByID(args[0])
  if (!group) ts.sendTextMessage(client.getID(), 1, 'That servergroup does not exist on the server.')

  let groupName = group.getCache().name

  let insert = {
    _id: args[0],
    name: groupName,
    prot: false,
    auth_users: [],
    auto_users: []
  }

  ts.data.collection('groups').insertOne(insert, (err, res) => {
    if (err) log.error('[DB] Error inserting/updating document:', err.stack)

    if (res.result.n === 0) {
      ts.sendTextMessage(client.getID(), 1, 'Group document was not inserted.')
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Successfully inserted group document.')
      log.info('[DB] Inserted new group document: group', args[0], groupName)
    }
  })
}

module.exports.info = {
  name: 'groupadd',
  usage: `${process.env.PREFIX}groupadd <id>`,
  desc: 'Adds a servergroup and its basic properties to the database.',
  module: 'db',
  level: 0
}
