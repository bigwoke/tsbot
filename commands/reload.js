const log = require('../log.js');

function refresh(modulePath) {
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
}

module.exports.run = async (ts, ev, client, args) => {
    if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');
    
    let toReload = ts.commands.get(args[0]);
    if(!toReload) return ts.sendTextMessage(client.getID(), 1, 'That command was not found.');
    let toReload_name = toReload.info.name;

    log.info(`Manually reloading command ${toReload_name}`);

    ts.commands.delete(toReload_name);

    let cmd = refresh(`./${toReload_name}.js`);
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