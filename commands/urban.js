const https = require('https');

module.exports.run = (ts, ev, client, args) => {
  const phrase = args.join(' ');
  if (!phrase) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');

  const dictURI = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(phrase)}`;
  https.get(dictURI, resp => {
    let data = '';

    resp.on('data', chunk => {
      data += chunk;
    });

    resp.on('end', () => {
      const response = JSON.parse(data).list;
      const entries = response.length >= 3 ? 3 : response.length;
      let msg = `Here are the top ${entries} entries on Urban Dictionary for "${phrase}":\n`;

      for (let ct = 0; ct < entries; ct++) {
        const def = response[ct].definition.replace(/[[\]]/gu, '').replace(/\n+/gu, ' ');
        const votes = response[ct].thumbs_up;
        const append = `\t[b]${ct + 1}[/b]:  ${def}\t[i](${votes} upvotes)[/i]\n`;

        if ((msg + append).length >= ts.charLimit) {
          msg = msg.replace(`${entries} entries`, `${ct} entries`);
          break;
        }
        msg += append;
      }
      ts.sendTextMessage(client.getID(), ev.targetmode, msg);
    });
  });
};

module.exports.info = {
  name: 'urban',
  usage: `${process.env.PREFIX}urban <phrase>`,
  desc: 'Gets the top entries for the given term from Urban Dictionary.',
  level: 2
};
