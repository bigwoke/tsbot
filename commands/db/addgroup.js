const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')
  let groupid = parseInt(args[0])

  let match = await ts.data.collection('groups').findOne({ _id: groupid })
  if (match) return ts.sendTextMessage(client.getID(), 1, 'Document already exists.')

  let _idRegex = /^\d+$/

  if (!_idRegex.test(groupid)) {
    return ts.sendTextMessage(client.getID(), 1, 'Given id does not match the required pattern.')
  }

  let group = await ts.getServerGroupByID(groupid)
  if (!group) ts.sendTextMessage(client.getID(), 1, 'That servergroup does not exist on the server.')

  let groupName = group.name

  let insert = {
    _id: groupid,
    name: groupName,
    prot: false,
    auth_users: [],
    auto_users: []
  }

  ts.data.collection('groups').insertOne(insert, (err, res) => {
    if (err) log.error('[DB] Error inserting document:', err.stack)

    if (res.result.n === 0) {
      ts.sendTextMessage(client.getID(), 1, 'Group document was not inserted.')
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Successfully inserted group document.')
      log.info('[DB] Inserted new group document: group', groupid, groupName)
    }
  })
}

module.exports.info = {
  name: 'addgroup',
  usage: `${process.env.PREFIX}addgroup <id>`,
  desc: 'Adds a servergroup and its basic properties to the database.',
  module: 'db',
  level: 0
}
