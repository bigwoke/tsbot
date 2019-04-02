const log = require('../../log.js')
const cfg = require('../../config.js')
const fs = require('fs')
const sgprot = cfg.modules.db ? null : require('../../sgprot.json')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')
  if (!Number.isInteger(parseInt(args[0]))) return ts.sendTextMessage(client.getID(), 1, 'First argument is not a group ID.')

  if (cfg.modules.db) {
    addUserDB()
  } else {
    addUserFile()
  }

  async function addUserDB () {
    let sgid = parseInt(args[0])
    let userDBName = args[1]

    let groupMatch = await ts.data.collection('groups').findOne({ _id: sgid })
    let userMatch = await ts.data.collection('users').findOne({ name: userDBName })

    if (!groupMatch) return ts.sendTextMessage(client.getID(), 1, 'That group is not registered in the database.')
    if (!userMatch) return ts.sendTextMessage(client.getID(), 1, 'That user is not registered in the database.')

    let filter = { _id: sgid }
    let update = { $addToSet: { auth_users: userMatch._id } }

    ts.data.collection('groups').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error updating auth_users in group document:', err.stack)

      if (res.result.n === 0) {
        ts.sendTextMessage(client.getID(), 1, 'Could not find specified group.')
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.getID(), 1, 'That user is already authorized.')
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.getID(), 1, `Successfully authorized ${userDBName}.`)
        log.info(`[DB] Added ${userDBName} to auth_users in group ${sgid}.`)
      } else {
        ts.sendTextMessage(client.getID(), 1, 'Issue authorizing user.')
      }
    })
  }

  async function addUserFile () {
    let sgid = parseInt(args[0])
    let uid = args[1]

    if (!sgprot[sgid]) sgprot[sgid] = []
    if (sgprot[sgid].includes(uid)) return ts.sendTextMessage(client.getID(), 1, 'That client is already an allowed member of the given group.')

    let servergroup = await ts.getServerGroupByID(Number.parseInt(sgid))
    if (!servergroup) return ts.sendTextMessage(client.getID(), 1, 'No server group with that ID could be found.')

    sgprot[sgid].push(uid)
    fs.writeFile('sgprot.json', JSON.stringify(sgprot, null, 2), err => {
      if (err) log.error(err)
    })

    ts.sendTextMessage(client.getID(), 1, `If ${uid} is a correct uid, that user is now an allowed member of group ${sgid}.`)
    log.info(`Root user has manually added ${uid} as an allowed member of protected group with ID ${sgid}`)
  }
}

module.exports.info = {
  name: 'addprot',
  usage: `${process.env.PREFIX}addprot <sgid> <${cfg.modules.db ? 'user name' : 'uniqueid'}>`,
  desc: 'Adds the given user to the protected list for the given server group.',
  module: 'sgprot',
  level: 0
}
