const log = require('../log.js');

function refresh (modulePath) {
  delete require.cache[require.resolve(modulePath)];
  try {
    return require(modulePath);
  } catch (err) {
    log.warn(`Issue reloading command file ${modulePath}:`, err.stack);
  }
}

module.exports.run = (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

  const toReload = ts.commands.get(args[0]);
  if (!toReload) return ts.sendTextMessage(client.getID(), 1, 'That command was not found.');
  const nameToReload = toReload.info.name;

  log.info(`Manually reloading command ${nameToReload}`);

  ts.commands.delete(nameToReload);

  const cmd = refresh(`./${nameToReload}.js`);
  if (!cmd || !cmd.info || !cmd.run) {
    return ts.sendTextMessage(client.getID(), 1, `Issue reloading ${nameToReload}, not reloading.`);
  }
  ts.commands.set(cmd.info.name, cmd);

  ts.sendTextMessage(client.getID(), 1, `Command ${nameToReload} has been manually reloaded.`);
};

module.exports.info = {
  name: 'reload',
  usage: `${process.env.PREFIX}reload <command>`,
  desc: 'Reloads the given command.',
  level: 0
};
