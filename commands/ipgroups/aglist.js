const tools = require('../../tools.js')
const cfg = require('../../config.js')
const autogroups = cfg.modules.db ? null : require('../../autogroups.json')

module.exports.run = async (ts, ev, client) => {
  if (cfg.modules.db) {
    userAutoListDB()
  } else {
    userAutoListFile()
  }

  async function userAutoListDB () {
    let msg = 'The following users are auto-assigned to these server groups:\n'
    let groups = await ts.data.collection('groups').find({ auto_users: { $exists: true, $ne: [] } }).toArray()
    if (groups.length === 0) return ts.sendTextMessage(client.getID(), 1, 'No auto-assigned users.')

    for (let i = 0; i < groups.length; i++) {
      let group = groups[i]

      msg += `Group [B]${group._id}[/B]:\t`

      for (let j = 0; j < group.auto_users.length; j++) {
        let userID = group.auto_users[j]
        let user = await ts.data.collection('users').findOne({ _id: userID })

        msg += `${j === 0 ? '' : ', '}${user.name}`
      }
    }
    ts.sendTextMessage(client.getID(), 1, msg)
  }

  async function userAutoListFile () {
    if (tools.isEmpty(autogroups)) return ts.sendTextMessage(client.getID(), 1, 'No server groups are assigned to any IP addresses.')

    let msg = 'The following IP addresses are assigned to these server groups:\n'

    for (let key in autogroups) {
      msg += `IP [b]${key}[/b]:\t`

      for (let value in autogroups[key]) {
        let group = await ts.getServerGroupByID(autogroups[key][value].toString())
        let groupName = group.getCache().name

        msg += `${parseInt(value) === 0 ? '' : ', '}${groupName} (${autogroups[key][value]})`
        if (value === autogroups[key].length) msg += '\n'
      }
    }
    ts.sendTextMessage(client.getID(), 1, msg)
  }
}

module.exports.info = {
  name: 'aglist',
  usage: `${process.env.PREFIX}aglist`,
  desc: 'Lists all IP addresses with groups assigned to them.',
  module: 'autogroups',
  level: 1
}
