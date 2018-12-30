const sgprot = require('../sgprot.json')
const tools = require('../tools.js')

module.exports.run = async (ts, ev, client) => {
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

module.exports.info = {
  name: 'sgplist',
  usage: `${process.env.PREFIX}sgplist`,
  desc: 'Lists all protected groups and their members.',
  module: 'sgprot',
  level: 1
}
