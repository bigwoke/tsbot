const https = require('https');

module.exports.run = async (ts, ev, client, args) => {

    let appid = args[0];
    
    if(!appid) return ts.sendTextMessage(client.getID(), 1, 'error: Argument(s) missing from command syntax!');
    if(!Number.isInteger(parseInt(appid))) return ts.sendTextMessage(client.getID(), 1, 'error: Required argument is not a number!');

    getPlayerCount(client, appid, (count, appname) => {
        if(ev.targetmode === 3) {
            ts.sendTextMessage('', 3, `Current ${appname} player count: [b]${count}[/b]`);
        } else if(ev.targetmode === 2) {
            ts.sendTextMessage(client.getCache().cid, 2, `Current ${appname} player count: [b]${count}[/b]`);
        } else {
            ts.sendTextMessage(client.getID(), 1, `Current ${appname} player count: [b]${count}[/b]`);
        }
    });

    function getPlayerCount(client, appid, callback) {
        let playercount_url = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?format=json&appid=' + appid;
        let appinfo_url_store = 'https://store.steampowered.com/api/appdetails/?appids=' + appid;
        let appinfo_url_full = 'https://api.steampowered.com/ISteamApps/GetAppList/v0001/';
        let count = null, appname = null;

        https.get(playercount_url, resp => {
            let data = '';

            resp.on('data', chunk => {
                data += chunk;
            });

            resp.on('end', () => {
                let response = JSON.parse(data).response;
                if(response.result !== 1) return ts.sendTextMessage(client.getID(), 1, 'No Steam game exists with that ID.');
                count = response.player_count;

                https.get(appinfo_url_store, resp => {
                    let data = '';

                    resp.on('data', chunk => {
                        data += chunk;
                    });

                    resp.on('end', () => {
                        let response = JSON.parse(data)[parseInt(appid)];
                        if(response.success === true) {
                            appname = response.data.name;
                            callback(count, appname);
                        } else {
                            https.get(appinfo_url_full, resp => {
                                let data = '';

                                resp.on('data', chunk => {
                                    data += chunk;
                                });

                                resp.on('end', () => {
                                    let game = JSON.parse(data).applist.apps.app.filter( obj => {
                                        obj.appid === parseInt(appid);
                                    })[0];

                                    if(!game) return ts.sendTextMessage(client.getID(), 1, 'No Steam game exists with that ID.');

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
};

module.exports.info = {
    name: 'playercount',
    usage: `${process.env.PREFIX}playercount <steam appid>`,
    desc: 'Gives the current player count of the given steam game.',
    level: 2
};