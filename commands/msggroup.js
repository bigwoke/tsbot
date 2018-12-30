module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let searchSGID = args[0]
  let targetgroup = await ts.getServerGroupByID(searchSGID)
  if (!targetgroup) return ts.sendTextMessage(client.getID(), 1, 'Could not find the given server group.')

  let message = args.slice(1).join(' ')

  let members = await targetgroup.clientList()

  if (!Array.isArray(members)) {
    let cl = await ts.getClientByUID(members.client_unique_identifier)
    ts.sendTextMessage(cl.getID(), 1, `[To group ${targetgroup.getCache().name}] from ${client.getCache().client_nickname}: ${message}`)
    ts.sendTextMessage(client.getID(), 1, `Sent message to group ${targetgroup.getCache().name}.`)
    return
  }

  members.forEach(async clinfo => {
    let cl = await ts.getClientByUID(clinfo.client_unique_identifier)
    ts.sendTextMessage(cl.getID(), 1, `[To group ${targetgroup.getCache().name}] from ${client.getCache().client_nickname}: ${message}`)
  })
  ts.sendTextMessage(client.getID(), 1, `Sent message to group ${targetgroup.getCache().name}.`)
}

module.exports.info = {
  name: 'msggroup',
  usage: `${process.env.PREFIX}msggroup <sgid> <message>`,
  desc: 'Sends a message to all online users in the group with the given ID.',
  level: 1
}
