const log = require('../../log.js')
const cfg = require('../../config.js')
const fs = require('fs')
const sgprot = cfg.modules.db ? null : require('../../sgprot.json')

let useDB = cfg.modules.db

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')
  if (!Number.isInteger(parseInt(args[0]))) return ts.sendTextMessage(client.getID(), 1, 'First argument is not a group ID.')

  if (useDB) {
    delUserDB()
  } else {
    delUserFile()
  }

  function delUserFile () {
    let sgid = parseInt(args[0])
    let uid = args[1]

    if (!sgprot[sgid]) return ts.sendTextMessage(client.getID(), 1, 'That group is not protected, and there are no users to protect.')
    if (!sgprot[sgid].includes(uid)) return ts.sendTextMessage(client.getID(), 1, 'That client is not currently an allowed user of that group.')

    for (let i = sgprot[sgid].length - 1; i >= 0; i--) {
      if (sgprot[sgid][i] === uid) {
        sgprot[sgid].splice(i, 1)
      }
    }

    if (!sgprot[sgid].length) delete sgprot[sgid]

    fs.writeFile('sgprot.json', JSON.stringify(sgprot, null, 4), err => {
      if (err) log.error(err)
    })

    ts.sendTextMessage(client.getID(), 1, `ID ${uid} has been removed from group ${sgid} protection.`)
    log.info(`Root user has manually removed ${uid} from allowed members list for protected group with ID ${sgid}`)
  }

  async function delUserDB () {
    let sgid = parseInt(args[0])
    let userDBName = args[1]

    let groupMatch = await ts.data.collection('groups').findOne({ _id: sgid })
    let userMatch = await ts.data.collection('users').findOne({ name: userDBName })

    if (!groupMatch) return ts.sendTextMessage(client.getID(), 1, 'That group is not registered in the database.')
    if (!userMatch) return ts.sendTextMessage(client.getID(), 1, 'That user is not registered in the database.')

    let filter = { _id: sgid }
    let update = { $pull: { auth_users: userMatch._id } }

    ts.data.collection('groups').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error updating auth_users in group document:', err.stack)

      if (res.result.n === 0) {
        ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.getID(), 1, 'That user is not authorized.')
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.getID(), 1, `Successfully deauthorized ${userDBName}.`)
        log.info(`[DB] Removed ${userDBName} from auth_users in group ${sgid}.`)
      } else {
        ts.sendTextMessage(client.getID(), 1, 'Issue deauthorizing user.')
      }
    })
  }
}

module.exports.info = {
  name: 'sgprm',
  usage: `${process.env.PREFIX}sgprm <sgid> <${useDB ? 'user name' : 'uniqueid'}>`,
  desc: 'Removes the given user from the protected list for the given server group.',
  module: 'sgprot',
  level: 0
}
