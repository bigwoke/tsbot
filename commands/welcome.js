const actions = require('../actions.js');
const cfg = require('../config')

module.exports.run = (ts, ev, client) => {
  actions.welcome(client, ts);
};

module.exports.info = {
  name: 'welcome',
  usage: `${cfg.bot.prefix}welcome`,
  desc: 'Sends the welcome message to the user who sent the command.',
  module: 'welcome',
  level: 2
};
