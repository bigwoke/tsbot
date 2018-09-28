const tools = require('../tools.js');

module.exports.run = async (ts, ev, client, args, log) => {
    if(!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

    let user_search = args.slice(0).join(/\s+/g);
    let results = await ts.clientDBFind(user_search, false).catch(err => {
        if(err.id === 1281) {
            ts.sendTextMessage(client.getID(), 1, 'No matching clients found in the database.');
        } else {
            log.error(err);
        }
    });

    if(!results) return;
    
    //If the search returns an array of multiple results
    if(Array.isArray(results)) {
        let dbidArray = results.map(user => user.cldbid);
        let resp = `Found ${dbidArray.length} matching clients in the database:\n`;
        let count = 0;

        //For each element in the array of DBIDs
        dbidArray.forEach( element => {
            ts.clientDBInfo(element)
                .then( user => {
                    let last_d = tools.toDate(user.client_lastconnected, 'd');
                    let last_t = tools.toDate(user.client_lastconnected, 't');
                    let user_nick = user.client_nickname;
                    count++;

                    if(resp.length >= 900) {
                        ts.sendTextMessage(client.getID(), 1, resp);
                        resp = '';
                    }

                    resp += `\n[B]${user_nick}[/B]: Last seen on ${last_d} at ${last_t}`;
                    if(count === dbidArray.length) ts.sendTextMessage(client.getID(), 1, resp);
                }).catch(err => log.error(err));
        });
    } else {
        let cldbid = results.cldbid;
        ts.clientDBInfo(cldbid)
            .then( user => {
                let last_d = tools.toDate(user.client_lastconnected, 'd');
                let last_t = tools.toDate(user.client_lastconnected, 't');
                let user_nick = user.client_nickname;

                let resp = 'Found 1 matching client in the database:';
                resp += `\n[B]${user_nick}[/B]: Last seen on ${last_d} at ${last_t}`;
                
                ts.sendTextMessage(client.getID(), 1, resp);
            }).catch(err => log.error(err));
    }
};

module.exports.info = {
    name: 'seen',
    usage: `${process.env.PREFIX}seen <nickname>`,
    desc: 'Lists the last time any users with the specified nickname were last online.',
    level: 2
};