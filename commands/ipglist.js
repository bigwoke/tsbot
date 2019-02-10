const ipgroups = require('../ipgroups.json')
const tools = require('../tools.js')

module.exports.run = async (ts, ev, client) => {
  if (tools.isEmpty(ipgroups)) return ts.sendTextMessage(client.getID(), 1, 'No server groups are assigned to any IP addresses.')

  let msg = 'The following IP addresses are assigned to these server groups:\n'

  for (let key in ipgroups) {
    msg += `IP [b]${key}[/b]:\t`

    for (let value in ipgroups[key]) {
      let group = await ts.getServerGroupByID(ipgroups[key][value].toString())
      let groupName = group.getCache().name

      msg += `${parseInt(value) === 0 ? '' : ', '}${groupName} (${ipgroups[key][value]})`
      if (value === ipgroups[key].length) msg += '\n'
    }
  }
  ts.sendTextMessage(client.getID(), 1, msg)
}

module.exports.info = {
  name: 'ipglist',
  usage: `${process.env.PREFIX}ipglist`,
  desc: 'Lists all IP addresses with groups assigned to them.',
  module: 'ipglist',
  level: 0
}
