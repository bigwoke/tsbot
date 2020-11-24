const https = require('https');

module.exports.run = (ts, ev, client, args) => {
  const [word] = args;
  const regex = /^[a-zA-Z]+$/u;
  if (!word) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');
  if (!regex.test(word)) return ts.sendTextMessage(client.getID(), 1, 'That does not seem to be a word.');

  const dictURI = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  https.get(dictURI, resp => {
    let data = '';

    resp.on('data', chunk => {
      data += chunk;
    });

    resp.on('end', () => {
      const response = JSON.parse(data);
      if (response.length === 0 || response[0].meanings.length === 0) {
        return ts.sendTextMessage(client.getID(), ev.targetmode, 'No definition.');
      }

      const [definition] = response;
      const meanings = definition.meanings.length;
      let msg = `Found ${meanings} meaning(s) for the word "${word}":\n`;

      for (let ct = 0; ct < meanings && msg.length < ts.charLimit - 100; ct++) {
        const meaning = definition.meanings[ct];
        const { partOfSpeech } = meaning;
        const def = meaning.definitions[0].definition;
        const append = `\t[b]${ct + 1}[/b]:  ${partOfSpeech}. ${def}\n`;

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
