const log = require('../log.js')
const fs = require('fs')
const ipgroups = require('../ipgroups.json')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let ip = args[0]
  let sgid = args[1]

  if (!ipgroups[ip]) return ts.sendTextMessage(client.getID(), 1, 'There are no groups assigned to that IP address.')
  if (!ipgroups[ip].includes(sgid)) return ts.sendTextMessage(client.getID(), 1, 'That IP address is not currently assigned the given server group.')

  for (let value in ipgroups[ip]) {
    if (ipgroups[ip][value] === sgid) {
      ipgroups[ip].splice(value, 1)
    }
  }

  if (!ipgroups[ip].length) delete ipgroups[ip]

  fs.writeFile('ipgroups.json', JSON.stringify(ipgroups, null, 2), err => {
    if (err) log.error(err)
  })

  ts.sendTextMessage(client.getID(), 1, `The server group ${sgid} is no longer assigned to IP ${ip}.`)
  log.info(`The server group ${sgid} has been removed from assignment to IP ${ip}.`)
}

module.exports.info = {
  name: 'ipgrm',
  usage: `${process.env.PREFIX}ipgrm <ip> <server group id>`,
  desc: 'Removes a server group id from assignment to the given IP address.',
  module: 'ipgroups',
  level: 0
}
