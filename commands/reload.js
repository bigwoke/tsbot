const log = require('../log.js')

function refresh (modulePath) {
  delete require.cache[require.resolve(modulePath)]
  return require(modulePath)
}

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let toReload = ts.commands.get(args[0])
  if (!toReload) return ts.sendTextMessage(client.getID(), 1, 'That command was not found.')
  let nameToReload = toReload.info.name

  log.info(`Manually reloading command ${nameToReload}`)

  ts.commands.delete(nameToReload)

  let cmd = refresh(`./${nameToReload}.js`)
  if (!cmd.info || !cmd.run) return ts.sendTextMessage(client.getID(), 1, `Issue reloading ${nameToReload}, not reloading.`)
  ts.commands.set(cmd.info.name, cmd)

  ts.sendTextMessage(client.getID(), 1, `Command ${nameToReload} has been manually reloaded.`)
}

module.exports.info = {
  name: 'reload',
  usage: `${process.env.PREFIX}reload <command>`,
  desc: 'Reloads the given command.',
  level: 0
}
