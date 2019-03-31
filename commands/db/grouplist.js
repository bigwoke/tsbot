const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  ts.data.collection('groups').find({}).toArray((err, res) => {
    if (err) log.error('[DB] Error fetching all group documents.', err.stack)
    let count = 1
    let resp = `[U]Group List Page ${count}[/U]:\n`

    res = res.sort((a, b) => {
      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    })

    res.forEach(group => {
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

      group.auth_users.forEach(user => {
        if (!authUsers) {
          authUsers = user
        } else {
          authUsers += `, ${user}`
        }
      })

      group.auto_users.forEach(user => {
        if (!autoUsers) {
          authUsers = user
        } else {
          authUsers += `, ${user}`
        }
      })

      resp += `[B]${group.name}[/B] (${group._id}):\tProt: ${group.prot}\tAuth: ${authUsers || 'NONE'}\tAuto: ${autoUsers || 'NONE'}\n`
    })

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
