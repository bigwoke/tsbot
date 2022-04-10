const cfg = require('../config');
const log = require('../log.js');

module.exports.run = (ts, ev, client) => {
  ts.whoami().then(bot => {
    ts.clientMove(bot.client_id, client.cid).catch(err => log.warn(err));
    log.debug(`SQ Client "${bot.name}" summoned by "${client.nickname}" to CID ${client.cid}`);
  });
};

module.exports.info = {
  name: 'summon',
  usage: `${cfg.bot.prefix}summon`,
  desc: 'Summons the bot to the channel of the sender, allowing it to read that channel\'s chat.',
  level: 1
};
