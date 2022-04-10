module.exports.run = async (ts, ev, client, args) => {
  if (!args[0] || !args[1]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const [searchUID] = args;
  const target = await ts.getClientByUID(searchUID);
  if (!target) return ts.sendTextMessage(client.clid, 1, 'Could not find the given client.');

  const message = args.slice(1).join(' ');

  ts.sendTextMessage(target.clid, 1, `[b]${client.nickname}[/b] says: ${message}`);
  ts.sendTextMessage(client.clid, 1, `Sent message to ${target.nickname}.`);
};

module.exports.info = {
  name: 'msguser',
  usage: `${process.env.PREFIX}msguser <unique ID> <message>`,
  desc: 'Sends a message to the user with the given unique ID.',
  level: 1
};
