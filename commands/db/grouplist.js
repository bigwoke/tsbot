const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  ts.data.collection('groups').find({}).toArray(async (err, res) => {
    if (err) log.error('[DB] Error fetching all group documents.', err.stack)
    let count = 1
    let resp = `[U]Group List Page ${count}[/U]:\n`

    res = res.sort((a, b) => {
      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    })

    for (let i = 0; i < res.length; i++) {
      let group = res[i]

      if (resp.length >= 900) {
        ts.sendTextMessage(client.getID(), 1, resp).catch(err => {
          ts.sendTextMessage(client.getID(), 1, 'ERR: Too many characters, please report this bug.')
          log.error('Error printing long message:', err.stack)
        })

        count++
        resp = `[U]Group List Page ${count}[/U]:\n`
      }

      let authUsers
      let autoUsers

      for (let j = 0; j < group.auth_users.length; j++) {
        let id = group.auth_users[j]
        let user = await ts.data.collection('users').findOne({ _id: id })
        console.log(id, user)
        if (!authUsers) {
          authUsers = user.name
        } else {
          authUsers += `, ${user.name}`
        }
      }

      for (let j = 0; j < group.auto_users.length; j++) {
        let id = group.auto_users[j]
        let user = await ts.data.collection('uers').findOne({ _id: id })
        if (!autoUsers) {
          autoUsers = user.name
        } else {
          authUsers += `, ${user.name}`
        }
      }

      resp += `[B]${group.name}[/B] (${group._id}):\tProt: ${group.prot}\tAuth: ${authUsers || 'NONE'}\tAuto: ${autoUsers || 'NONE'}\n`
    }

    if (res.length === 0) return ts.sendTextMessage(client.getID(), 1, 'No group documents.')
    ts.sendTextMessage(client.getID(), 1, resp).catch(err => {
      if (err.id === 1541) {
        ts.sendTextMessage(client.getID(), 1, 'ERR: Too many characters, please report this bug.')
      }
      log.error('Error printing long message:', err.stack)
    })
  })
}

module.exports.info = {
  name: 'grouplist',
  usage: `${process.env.PREFIX}grouplist`,
  desc: 'Lists groups in the database and their properties.',
  module: 'db',
  level: 1
}
