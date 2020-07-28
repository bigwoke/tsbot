const log = require('../log.js');
const fs = require('fs');
const cfg = require('../config.js');

module.exports.run = (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

  const [toEnable] = args;

  fs.readdir('./commands/', (err, files) => {
    if (err) log.error(err);

    const jsfiles = files.filter(file => file.split('.').pop() === 'js');

    if (jsfiles.includes(`${toEnable}.js`)) {
      if (ts.commands.has(toEnable)) return ts.sendTextMessage(client.getID(), 1, 'That command is already enabled.');
      if (cfg.modules[toEnable.info.module] === false) {
        return ts.sendTextMessage(client.getID(), 1, `The ${toEnable.info.module} module is disabled, and must be enabled to use this command.`);
      }
      const cmd = require(`./${toEnable}.js`);
      ts.commands.set(cmd.info.name, cmd);

      log.verbose(`Command ${cmd.info.name} has been manually enabled.`);
      ts.sendTextMessage(client.getID(), 1, `Command [b]${cmd.info.name}[/b] is now enabled.`);
    } else if (args[0] === '*') {
      jsfiles.forEach((file) => {
        const cmd = require(`./${file}`);
        ts.commands.set(cmd.info.name, cmd);
      });

      log.verbose('All commands have been manually enabled.');
      ts.sendTextMessage(client.getID(), 1, 'All commands have been enabled.');
    } else {
      ts.sendTextMessage(client.getID(), 1, 'That command was not found.');
    }
  });
};

module.exports.info = {
  name: 'enable',
  usage: `${process.env.PREFIX}enable <command>`,
  desc: 'Enables a currently disabled command.',
  level: 0
};
