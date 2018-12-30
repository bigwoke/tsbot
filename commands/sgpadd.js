const log = require('../log.js')
const fs = require('fs')
const sgprot = require('../sgprot.json')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')
  if (!Number.isInteger(parseInt(args[0]))) return ts.sendTextMessage(client.getID(), 1, 'First argument is not an integer!')

  let sgid = args[0]
  let uid = args[1]

  if (!sgprot[sgid]) sgprot[sgid] = []
  if (sgprot[sgid].includes(uid)) return ts.sendTextMessage(client.getID(), 1, 'That client is already an allowed member of the given group.')

  let servergroup = await ts.getServerGroupByID(Number.parseInt(sgid))
  if (!servergroup) return ts.sendTextMessage(client.getID(), 1, 'No server group with that ID could be found.')

  sgprot[sgid].push(uid)
  fs.writeFile('sgprot.json', JSON.stringify(sgprot, null, 4), err => {
    if (err) log.error(err)
  })

  ts.sendTextMessage(client.getID(), 1, `If ${uid} is a correct uid, that user is now an allowed member of group ${sgid}.`)
  log.info(`Root user has manually added ${uid} as an allowed member of protected group with ID ${sgid}`)
}

module.exports.info = {
  name: 'sgpadd',
  usage: `${process.env.PREFIX}sgpadd <sgid> <uniqueid>`,
  desc: 'Adds the given user to the protected list for the given server group.',
  module: 'sgprot',
  level: 0
}
