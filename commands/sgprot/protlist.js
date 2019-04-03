const cfg = require('../../config.js')
const sgprot = cfg.modules.db ? null : require('../../sgprot.json')
const tools = cfg.modules.db ? null : require('../../tools.js')

module.exports.run = async (ts, ev, client) => {
  if (cfg.modules.db) {
    userProtListDB()
  } else {
    userProtListFile()
  }

  async function userProtListFile () {
    if (tools.isEmpty(sgprot)) return ts.sendTextMessage(client.getID(), 1, 'There are no protected groups.')

    let msg = 'The following server groups are protected:\n'
    for (let key in sgprot) {
      let group = await ts.getServerGroupByID(key)
      let groupName = group.getCache().name

      msg += `[b]${groupName}[/b] (${key}):\t`

      let count = 0
      sgprot[key].forEach(uid => {
        msg += `${count === 0 ? '' : ', '}${uid}`
        count++
        if (count === sgprot[key].length) msg += '\n'
      })
    }
    ts.sendTextMessage(client.getID(), 1, msg)
  }

  async function userProtListDB () {
    let msg = 'The following server groups are protected:\n'
    let protGroups = await ts.data.collection('groups').find({ prot: true }).toArray()
    if (protGroups.length === 0) return ts.sendTextMessage(client.getID(), 1, 'No server groups are protected.')

    for (let i = 0; i < protGroups.length; i++) {
      let group = protGroups[i]
      msg += `[B]${group.name}[/B] (${group._id}):\t`

      for (let j = 0; j < group.auth_users.length; j++) {
        let id = group.auth_users[j]
        let user = await ts.data.collection('users').findOne({ _id: id })

        msg += `${j === 0 ? '' : ', '}${user.name}`
      }
      msg += '\n'
    }
    ts.sendTextMessage(client.getID(), 1, msg)
  }
}

module.exports.info = {
  name: 'protlist',
  usage: `${process.env.PREFIX}protlist`,
  desc: 'Lists all protected groups and their members.',
  module: 'sgprot',
  level: 1
}
