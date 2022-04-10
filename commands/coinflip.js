const cfg = require('../config');

module.exports.run = (ts, ev, client) => {
  let flipResult = null;
  flipResult = Math.floor(Math.random() * 2);
  flipResult = flipResult === 0 ? 'tails' : 'heads';

  ts.sendTextMessage(client.clid, ev.targetmode, `Coin flipped! You landed on ${flipResult}.`);
};

module.exports.info = {
  name: 'coinflip',
  usage: `${cfg.bot.prefix}coinflip`,
  desc: 'Simply flips a coin and returns heads or tails.',
  level: 2
};
