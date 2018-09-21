const actions = require('../actions.js');

module.exports.run = async (ts, ev, client) => {
    actions.welcome(client);
};

module.exports.info = {
    name: 'welcome',
    usage: `${process.env.PREFIX}welcome`,
    desc: 'Sends the welcome message to the user who sent the command.',
    module: 'welcome',
    level: 2
};