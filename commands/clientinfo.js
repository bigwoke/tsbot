module.exports.run = async (ts, ev, client, args, log) => {
    if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

    let uid_search = args[0];
    let target = await ts.getClientByUID(uid_search);

    if(!target) return ts.sendTextMessage(client.getID(), 1, 'Cannot find the client with that unique ID!');
    let target_nick = target.getCache().client_nickname;

    if(args[1] === 'log') {
        log.debug(`Cached info for client with uid '${uid_search}':`);
        log.debug(JSON.stringify(target.getCache(), null, 4));
        ts.sendTextMessage(client.getID(), 1, 'Cached client info logged.');
    } else {
        let resp = `Info for client "${target_nick}":\n${JSON.stringify(target.getCache(), null, 4)}`;
        ts.sendTextMessage(client.getID(), 1, resp);
    }
};

module.exports.info = {
    name: 'clientinfo',
    usage: `${process.env.PREFIX}clientinfo <uniqueid> [log]`,
    desc: 'Dumps information about the given client, with the option to log cached info.',
    level: 1
};