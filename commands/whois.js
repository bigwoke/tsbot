const tools = require('../tools.js');

module.exports.run = async (ts, ev, client, args) => {
    if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

    let uid_search = args[0];
    let target_dbid = await ts.clientDBFind(uid_search, true);
    let target = await ts.clientDBInfo(target_dbid.cldbid);

    if(!target) return ts.sendTextMessage(client.getID(), 1, 'Cannot find the client with that unique ID!');

    let resp = `Who is the client with UID "${uid_search}"?\n`;
    let target_nick = target.client_nickname;
    let target_seen = tools.toDate(target.client_lastconnected);
    resp += `Nickname: ${target_nick}\nDBID: ${target_dbid.cldbid}\nLast Seen: ${target_seen}`;
    ts.sendTextMessage(client.getID(), 1, resp);
};

module.exports.info = {
    name: 'whois',
    usage: `${process.env.PREFIX}whois <uniqueid>`,
    desc: 'Returns basic information about the client with the given unique ID.',
    level: 2
};