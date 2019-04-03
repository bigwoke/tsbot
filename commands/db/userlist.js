const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  ts.data.collection('users').find({}).toArray((err, res) => {
    if (err) log.error('[DB] Error fetching all user documents.', err.stack)
    let count = 1
    let resp = `[U]User List Page ${count}[/U]:\n`

    res = res.sort((a, b) => {
      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    })

    res.forEach(user => {
      if (resp.length >= 900) {
        ts.sendTextMessage(client.getID(), 1, resp).catch(err => {
          ts.sendTextMessage(client.getID(), 1, 'ERR: Too many characters, please report this bug.')
          log.error('Error printing long message:', err.stack)
        })

        count++
        resp = `[U]User List Page ${count}[/U]:\n`
      }

      let uids
      user.uid.forEach(uid => {
        if (!uids) {
          uids = uid
        } else {
          uids += `, ${uid}`
        }
      })
      resp += `[B]${user.name.padEnd(10)}[/B]:\t_id: ${user._id}\tuid: ${uids || 'NO UID'}\n`
    })

    if (res.length === 0) return ts.sendTextMessage(client.getID(), 1, 'No user documents.')
    ts.sendTextMessage(client.getID(), 1, resp).catch(err => {
      if (err.id === 1541) {
        ts.sendTextMessage(client.getID(), 1, 'ERR: Too many characters, please report this bug.')
      }
      log.error('Error printing long message:', err.stack)
    })
  })
}

module.exports.info = {
  name: 'userlist',
  usage: `${process.env.PREFIX}userlist`,
  desc: 'Lists users in the database and their UIDs.',
  module: 'db',
  level: 1
}
