const https = require('https');

module.exports.run = async (ts, ev, client, args) => {
    let word = args[0];    
    if(!word) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

    let dict_url = 'https://owlbot.info/api/v2/dictionary/' + word + '?format=json';
    https.get(dict_url, resp => {
        let data = '';

        resp.on('data', chunk => {
            data += chunk;
        });

        resp.on('end', () => {
            let response = JSON.parse(data);
            let definitions = response.length;

            let msg = `There are ${definitions} definitions for the word "${word}":\n`;

            for(let ct = 0; ct < definitions && msg.length < 900; ct++) {
                msg += `    [b]${ct + 1}[/b]:  ${response[ct].type}. ${response[ct].definition}\n`;
            }

            ts.sendTextMessage(client.getID(), ev.targetmode, msg);

        });
    });
};

module.exports.info = {
    name: 'define',
    usage: `${process.env.PREFIX}define <word>`,
    desc: 'Grabs the definition(s) for the given word.',
    level: 2
};