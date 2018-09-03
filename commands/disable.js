const fs = require('fs');

module.exports.run = async (ts, ev, client, args, log) => {
    if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Argument(s) missing from command syntax!');
    
    let toDisable = ts.commands.get(args[0]);
    if(!toDisable) {
        fs.readdir('./commands/', (err, files) => {
            if(err) log.error(err.stack);
            let jsfiles = files.filter(file => file.split('.').pop() === 'js');

            if(jsfiles.includes(`${args[0]}.js`)) {
                ts.sendTextMessage(client.getID(), 1, 'That command is already disabled!');
            } else {
                ts.sendTextMessage(client.getID(), 1, 'That command was not found.');
            }
        });
        return;
    } else {
        if(toDisable.info.level === 0) return ts.sendTextMessage(client.getID(), 1, 'Root commands cannot be disabled.');

        ts.commands.delete(toDisable.info.name);
        log.verbose(`Command ${toDisable.info.name} has been manually disabled.`);
        ts.sendTextMessage(client.getID(), 1, `Command [b]${toDisable.info.name}[/b] is now disabled.`);
    }
};

module.exports.info = {
    name: 'disable',
    usage: `${process.env.PREFIX}disable <command>`,
    desc: 'Disables a currently enabled command.',
    level: 0
};