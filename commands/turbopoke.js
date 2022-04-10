const cfg = require('../config')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');
  if (!Number.isInteger(parseInt(args[0], 10))) return ts.sendTextMessage(client.clid, 1, 'error: First argument is not a number!');

  const searchUser = args.slice(1).join(' ');
  const target = await ts.getClientByName(searchUser);

  if (!target) return ts.sendTextMessage(client.clid, 1, `Could not find user "${searchUser}"`);
  if (target.isQuery()) return ts.sendTextMessage(client.clid, 1, 'Bots cannot be targeted!');
  if (args[0] > 60 || args[0] <= 0) return ts.sendTextMessage(client.clid, 1, 'The allowed range of pokes is 1-60, for reasons.');

  const targetNick = target.nickname;
  const pokes = parseInt(args[0], 10);

  ts.sendTextMessage(client.clid, 1, `Poking "${targetNick}" ${pokes} times.`);

  let count = 1;
  const pokeInterval = setInterval(() => {
    target.poke(`(${count}/${pokes}) from "${client.nickname}"`);
    if (count === pokes) clearInterval(pokeInterval);
    count++;
  }, 500);
};

module.exports.info = {
  name: 'turbopoke',
  usage: `${cfg.bot.prefix}turbopoke <# of pokes> <nickname>`,
  desc: 'Pokes the target user the specified amount of times, up to 60.',
  level: 1
};
