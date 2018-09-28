module.exports.run = async (ts, ev, client, args) => {
    if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

    let uid_search = args[0];
    let target = await ts.getClientByUID(uid_search);

    if(!target) return ts.sendTextMessage(client.getID(), 1, 'Cannot find the client with that unique ID!');
    let target_nick = target.getCache().client_nickname;

    let resp = `Info for client "${target_nick}":\n${JSON.stringify(target.getCache(), null, 4)}`;
    ts.sendTextMessage(client.getID(), 1, resp);
};

module.exports.info = {
    name: 'clientinfo',
    usage: `${process.env.PREFIX}clientinfo <uniqueid>`,
    desc: 'Dumps information about any currently online client.',
    level: 1
};