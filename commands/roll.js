const cfg = require('../config');

module.exports.run = (ts, ev, client, args) => {
  let upperLimit = 6;
  let rollResult = null;

  if (args[0] && Number.isInteger(parseInt(args[0], 10)) && args[0] > 0) {
    [upperLimit] = args;
  }

  rollResult = Math.floor(Math.random() * Math.floor(upperLimit)) + 1;

  ts.sendTextMessage(client.clid, ev.targetmode, `On a die labeled 1 to ${upperLimit}, you rolled a ${rollResult}.`);
};

module.exports.info = {
  name: 'roll',
  usage: `${cfg.bot.prefix}roll [max]`,
  desc: 'Picks a number between one and the inclusive upper limit given, or six if none is given.',
  level: 2
};
