const log = require('../log.js');
const tools = require('../tools.js');

module.exports.run = async (ts, ev, client, args) => {
    if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');
    
    let toReload = ts.commands.get(args[0]);
    if(!toReload) return ts.sendTextMessage(client.getID(), 1, 'That command was not found.');

    log.info(`Manually reloading command ${toReload}`);

    let toReload_name = toReload.info.name;
    ts.commands.delete(toReload_name);

    let cmd = tools.refresh(`./${toReload_name}.js`);
    if(!cmd.info || !cmd.run) return ts.sendTextMessage(client.getID(), 1, `Issue reloading ${toReload_name}, not reloading.`);
    ts.commands.set(cmd.info.name, cmd);

    ts.sendTextMessage(client.getID(), 1, `Command ${toReload_name} has been manually reloaded.`);
};

module.exports.info = {
    name: 'reload',
    usage: `${process.env.PREFIX}reload <command>`,
    desc: 'Reloads the given command.',
    level: 0
};