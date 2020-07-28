const https = require('https');

module.exports.run = (ts, ev, client, args) => {
  const [word] = args;
  const regex = /^[a-zA-Z]+$/u;
  if (!word) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');
  if (!regex.test(word)) return ts.sendTextMessage(client.getID(), 1, 'That does not seem to be a word.');

  const dictURI = `https://owlbot.info/api/v2/dictionary/${word}?format=json`;
  https.get(dictURI, resp => {
    let data = '';

    resp.on('data', chunk => {
      data += chunk;
    });

    resp.on('end', () => {
      const response = JSON.parse(data);
      if (!response.definition) return ts.sendTextMessage(client.getID(), ev.targetmode, 'No definition.');

      const definitions = response.length;
      let msg = `Found ${definitions} definition(s) for the word "${word}":\n`;

      for (let ct = 0; ct < definitions && msg.length < ts.charLimit - 100; ct++) {
        const { type } = response[ct];
        const def = response[ct].definition.replace(/â/gu, '"');
        const append = `\t[b]${ct + 1}[/b]:  ${type}. ${def}\n`;

        if ((msg + append).length >= ts.charLimit) {
          break;
        }
        msg += append;
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
