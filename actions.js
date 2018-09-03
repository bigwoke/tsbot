const bot = require('./bot.js');
const tools = require('./tools.js');
const cfg = require('./config.js');

async function sendWelcomeMessage(client){
    if(!client || client.isQuery()) return;
    let nick = client.getCache().client_nickname;

    let cl = await bot.ts.clientDBInfo(client.getCache().client_database_id);
    let created_date = tools.convertEpoch(cl.client_created);
    let created_time = tools.convertEpoch(cl.client_created, 'time');

    let visit_count = cl.client_totalconnections.toString();

    let end = visit_count.slice(-1);
    let num_suffix = (end == 1) ? 'st' : (end == 2) ? 'nd' : (end == 3) ? 'rd' : 'th';

    let welcome = `Hello [b]${nick}[/b], this is your ${visit_count + num_suffix} visit! `;
    welcome += `We first saw you on ${created_date} at ${created_time} EST.\n`;
    welcome += `You can use the command [I]${cfg.bot.prefix}help[/I] to see what you can do.`;

    bot.ts.sendTextMessage(client.getID(), 1, welcome);
}

async function groupProtectionCheck(client) {
    let uid = client.getCache().client_unique_identifier;

    let sgProtInterval = setInterval( async () => {
        let cl = await client.getInfo();

        cl.client_servergroups.forEach( async sgid => {
            for(let key in cfg.sgprot) {
                if(parseInt(key) === sgid && !cfg.sgprot[key].includes(uid)) {
                    let group = await bot.ts.getServerGroupByID(sgid);

                    client.serverGroupDel(sgid);
                    client.poke(`The server group [B]${group.getCache().name}[/B] is protected!`);
                }
            }
        });
    }, 2000);

    client.on('clientdisconnect', () => {
        clearInterval(sgProtInterval);
    });
}

module.exports = {
    welcome: sendWelcomeMessage,
    sgCheck: groupProtectionCheck
};