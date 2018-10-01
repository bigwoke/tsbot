const log = require('../log.js');
const fs = require('fs');
const sgprot = require('../sgprot.json');

module.exports.run = async (ts, ev, client, args) => {
    if(!args[1]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');
    if(!Number.isInteger(parseInt(args[0]))) return ts.sendTextMessage(client.getID(), 1, 'First argument is not an integer!');

    let sgid = args[0];
    let uid = args[1];
    
    if(!sgprot[sgid]) return ts.sendTextMessage(client.getID(), 1, 'That group is not protected, and there are no users to protect.');
    if(!sgprot[sgid].includes(uid)) return ts.sendTextMessage(client.getID(), 1, 'That client is not currently an allowed user of that group.');
    
    for(let i = sgprot[sgid].length-1; i >= 0; i--) {
        if(sgprot[sgid][i] === uid) {
            sgprot[sgid].splice(i, 1);
        }
    }
    
    if(!sgprot[sgid].length) delete sgprot[sgid];

    fs.writeFile('sgprot.json', JSON.stringify(sgprot, null, 4), err => {
        if(err) log.error(err);
    });

    ts.sendTextMessage(client.getID(), 1, `ID ${uid} has been removed from group ${sgid} protection.`);
    log.info(`Root user has manually removed ${uid} from allowed members list for protected group with ID ${sgid}`);
};

module.exports.info = {
    name: 'sgprm',
    usage: `${process.env.PREFIX}sgprm <sgid> <uniqueid>`,
    desc: 'Removes the given user from the protected list for the given server group.',
    module: 'sgprot',
    level: 0
};