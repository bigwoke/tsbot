const log = require('../log.js')
const fs = require('fs')
const ipgroups = require('../ipgroups.json')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let ip = args[0]
  let sgid = args[1]

  if (!ipgroups[ip]) ipgroups[ip] = []
  if (ipgroups[ip].includes[sgid]) return ts.sendTextMessage(client.getID(), 1, 'That IP address has already been assigned the given server group.')

  let servergroup = await ts.getServerGroupByID(Number.parseInt(sgid))
  if (!servergroup) return ts.sendTextMessage(client.getID(), 1, 'No server group with that ID could be found.')

  ipgroups[ip].push(sgid)
  fs.writeFile('ipgroups.json', JSON.stringify(ipgroups, null, 2), err => {
    if (err) log.error(err)
  })

  ts.sendTextMessage(client.getID(), 1, `The given IP address has been assigned server group ${sgid}.`)
  log.info(`The IP address ${ip} has been assigned server group ${sgid}.`)
}

module.exports.info = {
  name: 'ipgadd',
  usage: `${process.env.PREFIX}ipgadd <ip address> <server group id>`,
  desc: 'Assigns the given server group to an IP address.',
  module: 'groupbyip',
  level: 0
}
