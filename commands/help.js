const cfg = require('../config')
const log = require('../log.js');

module.exports.run = (ts, ev, client, args) => {
  if (args[0]) {
    const cmd = ts.commands.get(args[0]);
    if (!cmd) return ts.sendTextMessage(client.clid, 1, `No command with the name "${args[0]}" exists.`);
    const colors = ['#ff3300', '#d58500', '#00825a'];
    const color = colors[cmd.info.level];

    if (client.level <= cmd.info.level) {
      ts.sendTextMessage(client.clid, ev.targetmode, `[color=${color}]${cmd.info.usage}[/color] - ${cmd.info.desc}\n`);
    } else {
      ts.sendTextMessage(client.clid, ev.targetmode, 'You do not have permission to view info for this command.');
    }
  } else {
    let count = 1;
    let resp = `[U]Command Page ${count}[/U]:\n`;

    const commands = new Map(Array
      .from(ts.commands)
      .sort((a, b) => {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
      }));

    commands.forEach(cmd => {
      const colors = ['#ff3300', '#d58500', '#00825a'];
      const color = colors[cmd.info.level];
      if (client.level <= cmd.info.level) {
        if (resp.length >= ts.charLimit - 100) {
          ts.sendTextMessage(client.clid, 1, resp).catch(err => {
            ts.sendTextMessage(client.clid, 1, 'error: Too many characters in response.');
            log.error(err);
          });
          count++;
          resp = `[U]Command Page ${count}[/U]:\n`;
        }
        resp += `[color=${color}]${cmd.info.usage}[/color] - ${cmd.info.desc}\n`;
      }
    });

    ts.sendTextMessage(client.clid, 1, resp).catch(err => {
      if (err.id === 1541) {
        ts.sendTextMessage(client.clid, 1, 'error: Too many characters, please report this bug.');
        log.error(err);
      } else {
        log.error(err);
      }
    });
  }
};

module.exports.info = {
  name: 'help',
  usage: `${cfg.bot.prefix}help`,
  desc: 'Displays help information and accessible commands.',
  level: 2
};
