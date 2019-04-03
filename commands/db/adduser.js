const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument!')

  let match = await ts.data.collection('users').findOne({ name: args[0] })
  if (match) return ts.sendTextMessage(client.getID(), 1, 'Document already exists.')

  let uidRegex = /^.{27}=$/g
  let nameRegex = /^[a-z_ ]+$/i

  if (!nameRegex.test(args[0])) {
    return ts.sendTextMessage(client.getID(), 1, 'Name does not match the required pattern.')
  }

  if (args[1] && !uidRegex.test(args[1])) {
    return ts.sendTextMessage(client.getID(), 1, 'Unique ID does not match the required pattern.')
  }

  let filter = { name: args[0] }
  let update = { $set: { uid: [] } }
  let options = { upsert: true }

  if (args[1]) {
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

    update = { $addToSet: { uid: args[1], ip: addr } }
  }

  ts.data.collection('users').updateOne(filter, update, options, (err, res) => {
    if (err) log.error('[DB] Error inserting/updating document:', err.stack)

    if (res.result.upserted) {
      ts.sendTextMessage(client.getID(), 1, 'Successfully inserted user document.')
      log.info('[DB] New user document inserted:', args[0])
    } else {
      if (res.result.n === 0) {
        ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.getID(), 1, 'User document already has that value.')
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.getID(), 1, 'Successfully updated user document.')
        log.info('[DB] Existing user document updated:', args[0])
      } else {
        ts.sendTextMessage(client.getID(), 1, 'Issue editing document.')
      }
    }
  })
}

module.exports.info = {
  name: 'adduser',
  usage: `${process.env.PREFIX}adduser <name> [unique ID]`,
  desc: 'Adds a user and their unique ID to the database.',
  module: 'db',
  level: 1
}
