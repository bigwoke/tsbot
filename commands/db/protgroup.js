const log = require('../../log.js');

module.exports.run = async (ts, ev, client, args) => {
  if (!args[0]) return ts.sendTextMessage(client.clid, 1, 'error: Missing argument!');
  const groupid = parseInt(args[0], 10);

  const match = await ts.data.collection('groups').findOne({ _id: groupid });
  if (!match) return ts.sendTextMessage(client.clid, 1, 'Document does not exist.');

  const filter = { _id: groupid };
  let update = { $set: { prot: true } };
  let resp = `Group ${groupid} protection is now enabled.`;

  if (match.prot) {
    update = { $set: { prot: false } };
    resp = `Group ${groupid} protection is now disabled.`;
  }

  ts.data.collection('groups').updateOne(filter, update, (err) => {
    if (err) log.error('[DB] Error setting protection status of group:', err.stack);

    ts.sendTextMessage(client.clid, 1, resp);
    log.info(`[DB] Group ${groupid} protection is now enabled.`);
  });
};

module.exports.info = {
  name: 'protgroup',
  usage: `${process.env.PREFIX}protgroup <id>`,
  desc: 'Toggles protected status of the given servergroup.',
  module: 'db',
  level: 0
};
