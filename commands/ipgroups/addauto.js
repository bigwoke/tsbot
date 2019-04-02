const log = require('../../log.js')
const cfg = require('../../config.js')
const fs = require('fs')
const autogroups = cfg.modules.db ? null : require('../../autogroups.json')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')
  if (!Number.isInteger(parseInt(args[0]))) return ts.sendTextMessage(client.getID(), 1, 'First argument is not a group ID.')

  if (cfg.modules.db) {
    addUserDB()
  } else {
    addUserFile()
  }

  async function addUserDB () {
    let sgid = parseInt(args[0])
    let user = await ts.data.collection('users').findOne({ name: args[1] })
    if (!user) return ts.sendTextMessage(client.getID(), 1, 'That user is not registered in the database.')

    let filter = { _id: sgid }
    let update = { $addToSet: { auto_users: user._id } }

    ts.data.collection('groups').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error adding autoassigned user to group:', err.stack)

      if (res.result.n === 0) {
        ts.sendTextMessage(client.getID(), 1, 'Could not find specified group.')
      } else if (res.result.nModified === 0) {
        ts.sendTextMessage(client.getID(), 1, 'User is already autoassigned to this group.')
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.getID(), 1, 'Successfully added autoassign user to group.')
        log.info(`[DB] User ${user.name} added to group ${sgid}`)
      } else {
        ts.sendTextMessage(client.getID(), 1, 'Issue authorizing user.')
      }
    })
  }

  async function addUserFile () {
    let ip = args[1]
    let sgid = args[0]

    if (!autogroups[ip]) autogroups[ip] = []
    if (autogroups[ip].includes[sgid]) return ts.sendTextMessage(client.getID(), 1, 'That IP address has already been assigned the given server group.')

    let servergroup = await ts.getServerGroupByID(Number.parseInt(sgid))
    if (!servergroup) return ts.sendTextMessage(client.getID(), 1, 'No server group with that ID could be found.')

    autogroups[ip].push(sgid)
    fs.writeFile('autogroups.json', JSON.stringify(autogroups, null, 2), err => {
      if (err) log.error(err)
    })

    ts.sendTextMessage(client.getID(), 1, `The given IP address has been assigned server group ${sgid}.`)
    log.info(`The IP address ${ip} has been assigned server group ${sgid}.`)
  }
}

module.exports.info = {
  name: 'addauto',
  usage: `${process.env.PREFIX}addauto <sgid> <${cfg.modules.db ? 'user name' : 'ip address'}>`,
  desc: 'Assigns the given server group to an IP address.',
  module: 'autogroups',
  level: 0
}
