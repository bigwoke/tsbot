const cfg = require('../../config');

const ipRegex = /^(?:(?:25[0-5]|(?:2[0-4]|1[0-9]|[1-9]|)[0-9])(?:\.(?!$)|$)){4}$/u;
const uidRegex = /^.{27}=$/u;
const mytsRegex = /^.{45}=$/u;

function addUser (ts, client, identifier, who) {
  if (ipRegex.test(identifier)) {
    ts.data.collection('whitelist').insertOne({ name: who, ip: identifier });
    return ts.sendTextMessage(client.clid, 1, `User with identifier "${identifier}" added to whitelist.`);
  } else if (uidRegex.test(identifier)) {
    ts.getClientByUID(identifier).then(cl => {
      if (!cl) return ts.sendTextMessage(client.clid, 1, 'That UID could not be found.');
      cl.getInfo().then(info => {
        if (!info) return ts.sendTextMessage(client.clid, 1, 'The user with that UID is not online.');
        if (!info.client_myteamspeak_id) return ts.sendTextMessage(client.clid, 1, 'That user does not have a MyTS account.');
        ts.data.collection('whitelist').insertOne({ name: who, mytsid: info.client_myteamspeak_id });
        return ts.sendTextMessage(client.clid, 1, `User with identifier "${identifier}" added to whitelist.`);
      });
    });
  }
}

function delUser (ts, client, identifier) {
  if (ipRegex.test(identifier)) {
    ts.data.collection('whitelist').findOneAndDelete({ ip: identifier }).then(res => {
      if (res.value) return ts.sendTextMessage(client.clid, 1, `IP "${identifier}" removed from whitelist.`);
      return ts.sendTextMessage(client.clid, 1, `IP "${identifier}" is not whitelisted.`);
    });
  } else if (mytsRegex.test(identifier)) {
    ts.data.collection('whitelist').findOneAndDelete({ mytsid: identifier }).then(res => {
      if (res.value) return ts.sendTextMessage(client.clid, 1, `MYTSID "${identifier}" removed from whitelist.`);
      return ts.sendTextMessage(client.clid, 1, `MYTSID "${identifier}" is not whitelisted.`);
    });
  }
  ts.data.collection('whitelist').findOneAndDelete({ name: identifier }).then(res => {
    if (res.value) return ts.sendTextMessage(client.clid, 1, `User "${identifier}" removed from whitelist.`);
    return ts.sendTextMessage(client.clid, 1, `User "${identifier}" is not whitelisted.`);
  });
}

module.exports.run = (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  if (args[0].toLowerCase() === 'add' && !args[2]) {
    return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  }
  if (args[0].toLowerCase() === 'remove' && !args[1]) {
    return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  }

  switch (args[0].toLowerCase()) {
    case 'add':
      addUser(ts, client, args[1], args.slice(2).join(' '));
      break;
    case 'remove':
      delUser(ts, client, args.slice(1).join(' '));
      break;
    case 'enable':
      cfg.modules.whitelist = true;
      ts.sendTextMessage(client.clid, 1, 'Server whitelist enabled.');
      break;
    case 'disable':
      cfg.modules.whitelist = false;
      ts.sendTextMessage(client.clid, 1, 'Server whitelist disabled.');
      break;
    case 'list':
      ts.data.collection('whitelist').find().toArray().then(wl => {
        let msg = 'Server whitelist:\n';
        for (const entry of wl) {
          msg += `${entry.name}:\t${entry.ip ? entry.ip : entry.mytsid}\n`;
        }
        if (msg === 'Server whitelist:\n') msg = 'Whitelist is empty!';
        ts.sendTextMessage(client.clid, 1, msg);
      });
      break;
    default:
      return ts.sendTextMessage(client.clid, 1, 'Didn\'t recognize that subcommand!');
  }
};

module.exports.info = {
  name: 'whitelist',
  usage: `${cfg.bot.prefix}whitelist <add | remove | enable | disable | list> {ip | uniqueID} {name}`,
  desc: 'Interacts with the server whitelist.',
  module: 'db',
  level: 0
};
