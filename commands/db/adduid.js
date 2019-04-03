const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let match = await ts.data.collection('users').findOne({ name: args[0] })
  if (!match) return ts.sendTextMessage(client.getID(), 1, 'Could not find user.')

  let uidRegex = /^.{27}=$/g

  if (!uidRegex.test(args[1])) {
    return ts.sendTextMessage(client.getID(), 1, 'Unique ID does not match the required pattern.')
  }

  let cl = await ts.getClientByUID(args[1])
  let addr
  if (!cl) {
    ts.clientDBFind(args[1], true).then(clFind => {
      ts.clientDBInfo(clFind.cldbid).then(cl => {
        addr = cl.client_lastip
      })
    })
  } else {
    addr = cl.getCache().connection_client_ip
  }

  let filter = { name: args[0] }
  let update = { $addToSet: { uid: args[1], ip: addr } }

  ts.data.collection('users').updateOne(filter, update, (err, res) => {
    if (err) log.error('[DB] Error updating document:', err.stack)

    if (res.result.n === 0) {
      ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
    } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
      ts.sendTextMessage(client.getID(), 1, 'User document already has that ID.')
    } else if (res.result.nModified === 1) {
      ts.sendTextMessage(client.getID(), 1, 'Successfully added unique ID.')
      log.info('[DB] Unique ID', args[1], 'added to', args[0])
    } else {
      ts.sendTextMessage(client.getID(), 1, 'Issue adding unique ID.')
    }
  })
}

module.exports.info = {
  name: 'adduid',
  usage: `${process.env.PREFIX}adduid <name> <unique ID>`,
  desc: 'Adds a unique ID to a user document.',
  module: 'db',
  level: 0
}
