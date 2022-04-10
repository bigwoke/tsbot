const https = require('https');

module.exports.run = (ts, ev, client, args) => {
  const [appid] = args;

  if (!appid) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  if (!Number.isInteger(parseInt(appid, 10))) return ts.sendTextMessage(client.clid, 1, 'error: Required argument is not a number!');

  function getPlayerCount (cl, id, callback) {
    const playercountURI = `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?format=json&appid=${id}`;
    const appinfoStoreURI = `https://store.steampowered.com/api/appdetails/?appids=${id}`;
    const appinfoFullURI = 'https://api.steampowered.com/ISteamApps/GetAppList/v0001/';
    let count = null;
    let appname = null;

    https.get(playercountURI, resp => {
      let data = '';

      resp.on('data', chunk => {
        data += chunk;
      });

      resp.on('end', () => {
        const { response } = JSON.parse(data);
        if (response.result !== 1) return ts.sendTextMessage(cl.clid, 1, 'No Steam game exists with that ID.');
        count = response.player_count;

        https.get(appinfoStoreURI, resp => {
          let data = '';

          resp.on('data', chunk => {
            data += chunk;
          });

          resp.on('end', () => {
            const response = JSON.parse(data)[parseInt(id, 10)];
            if (response.success === true) {
              appname = response.data.name;
              callback(count, appname);
            } else {
              https.get(appinfoFullURI, resp => {
                let data = '';

                resp.on('data', chunk => {
                  data += chunk;
                });

                resp.on('end', () => {
                  const [game] = JSON.parse(data).applist.apps.app.filter(obj => obj.appid === parseInt(id, 10));

                  if (!game) return ts.sendTextMessage(cl.clid, 1, 'No Steam game exists with that ID.');

                  appname = game.name;
                  callback(count, appname);
                });
              });
            }
          });
        });
      });
    });
  }

  getPlayerCount(client, appid, (count, appname) => {
    ts.sendTextMessage(client.clid, ev.targetmode, `Current ${appname} player count: [b]${count}[/b]`);
  });
};

module.exports.info = {
  name: 'playercount',
  usage: `${process.env.PREFIX}playercount <steam appid>`,
  desc: 'Gives the current player count of the given steam game.',
  level: 2
};
