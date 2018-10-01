module.exports.run = async (ts, ev, client, args) => {
    if(!args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

    let sgid_search  = args[0];
    let targetgroup = await ts.getServerGroupByID(sgid_search);
    if(!targetgroup) return ts.sendTextMessage(client.getID(), 1, 'Could not find the given server group.');

    let message = args.slice(1).join(' ');

    let group_members = await targetgroup.clientList();

    if(!Array.isArray(group_members)) {
        let cl = await ts.getClientByUID(group_members.client_unique_identifier);
        ts.sendTextMessage(cl.getID(), 1, `[To group ${targetgroup.getCache().name}] from ${client.getCache().client_nickname}: ${message}`);
        ts.sendTextMessage(client.getID(), 1, `Sent message to group ${targetgroup.getCache().name}.`);
        return;
    }

    group_members.forEach( async clinfo => {
        let cl = await ts.getClientByUID(clinfo.client_unique_identifier);
        ts.sendTextMessage(cl.getID(), 1, `[To group ${targetgroup.getCache().name}] from ${client.getCache().client_nickname}: ${message}`);
    });
    ts.sendTextMessage(client.getID(), 1, `Sent message to group ${targetgroup.getCache().name}.`);
};

module.exports.info = {
    name: 'msggroup',
    usage: `${process.env.PREFIX}msggroup <sgid> <message>`,
    desc: 'Sends a message to all online users in the group with the given ID.',
    level: 1
};