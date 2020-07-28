module.exports.run = (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!');
  const msg = args.join(' ');
  ts.gm(msg);
};

module.exports.info = {
  name: 'gm',
  usage: `${process.env.PREFIX}gm <message>`,
  desc: 'Sends the given message globally to all virtual servers, as the server itself.',
  level: 0
};
