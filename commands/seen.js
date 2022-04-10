const log = require('../log.js');
const cfg = require('../config');
const tools = require('../tools.js');

module.exports.run = (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const searchUser = args.slice(0).join(/\s+/gu);

  async function findTS3User () {
    let results = await ts.clientDBFind(searchUser, false).catch(err => {
      if (err.id === 1281) {
        ts.sendTextMessage(client.clid, ev.targetmode, 'No matching TeamSpeak clients found.');
      } else {
        log.error(err);
      }
    });

    if (!results) return;

    // If the search returns an array of multiple results
    if (Array.isArray(results) && results.length > 1) {
      const dbidArray = results.map(user => user.cldbid);
      let resp = `Found ${dbidArray.length} matching TeamSpeak clients:\n`;
      let count = 0;

      // For each element in the array of DBIDs
      dbidArray.forEach(element => {
        ts.clientDBInfo(element)
          .then(user => {
            [user] = user;
            const lastDate = tools.toDate(user.client_lastconnected, 'd');
            const lastTime = tools.toDate(user.client_lastconnected, 't');
            const userNick = user.client_nickname;
            count++;

            if (resp.length >= ts.charLimit - 100) {
              ts.sendTextMessage(client.clid, 1, resp).catch(err => {
                ts.sendTextMessage(client.clid, 1, 'error: Too many characters in response.');
                log.error('Error printing long message:', err.stack);
              });
              resp = '';
            }

            resp += `\n[B]${userNick}[/B]: Last seen on ${lastDate} at ${lastTime}`;
            if (count === dbidArray.length) ts.sendTextMessage(client.clid, 1, resp);
          }).catch(err => log.error(err));
      });
    } else {
      if (Array.isArray(results) && results.length === 1) {
        [results] = results;
      }
      const { cldbid } = results;
      ts.clientDBInfo(cldbid)
        .then(user => {
          [user] = user;
          const lastDate = tools.toDate(user.client_lastconnected, 'd');
          const lastTime = tools.toDate(user.client_lastconnected, 't');
          const userNick = user.client_nickname;

          let resp = 'Found 1 matching TeamSpeak client:';
          resp += `\n[B]${userNick}[/B]: Last seen on ${lastDate} at ${lastTime}`;

          ts.sendTextMessage(client.clid, 1, resp);
        }).catch(err => log.error(err));
    }
  }

  if (cfg.modules.db) {
    ts.data.collection('users').findOne({ name: searchUser }).then(res => {
      if (res) {
        if (res.seen) {
          ts.sendTextMessage(client.clid, ev.targetmode, `${res.name} was last seen ` +
            `(joining or leaving) at ${res.seen.toLocaleString()}.`);
        } else {
          ts.sendTextMessage(client.clid, ev.targetmode, `${res.name} is missing ` +
            'a last seen date entry.');
          findTS3User();
        }
      } else {
        findTS3User();
      }
    });
  }
};

module.exports.info = {
  name: 'seen',
  usage: `${cfg.bot.prefix}seen <nickname>`,
  desc: 'Lists the last time any users with the specified nickname were last online.',
  level: 2
};
