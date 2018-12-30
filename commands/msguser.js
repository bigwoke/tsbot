module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let searchUID = args[0]
  let target = await ts.getClientByUID(searchUID)
  if (!target) return ts.sendTextMessage(client.getID(), 1, 'Could not find the given client.')

  let message = args.slice(1).join(' ')

  ts.sendTextMessage(target.getID(), 1, `[b]${client.getCache().client_nickname}[/b] says: ${message}`)
  ts.sendTextMessage(client.getID(), 1, `Sent message to ${target.getCache().client_nickname}.`)
}

module.exports.info = {
  name: 'msguser',
  usage: `${process.env.PREFIX}msguser <unique ID> <message>`,
  desc: 'Sends a message to the user with the given unique ID.',
  level: 1
}
