module.exports.run = (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument(s)!');

  const msg = args.join(' ');
  ts.sendTextMessage('', 3, msg);
};

module.exports.info = {
  name: 'broadcast',
  usage: `${process.env.PREFIX}broadcast <message>`,
  desc: 'Sends the given message to the current virtual server as the bot.',
  level: 1
};
