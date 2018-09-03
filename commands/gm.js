module.exports.run = async (ts, ev, client) => {
    /* if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Argument(s) missing from command syntax!');
    let msg = args.join(' ');
    ts.gm(msg); */
    return ts.sendTextMessage(client.getID(), 1, 'The GM command is currently disabled due to an issue with the API wrapper I use.');
};

module.exports.info = {
    name: 'gm',
    usage: `${process.env.PREFIX}gm <message>`,
    desc: 'Sends the given message globally to all virtual servers, as the server itself.',
    level: 0
};