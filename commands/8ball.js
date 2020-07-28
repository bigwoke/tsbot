module.exports.run = (ts, ev, client) => {
  const outlookList = [
    'It is certain.',
    'It is decidedly so.',
    'Without a doubt.',
    'Yes - definitely.',
    'You may rely on it.',
    'As I see it, yes.',
    'Most likely.',
    'Outlook good.',
    'Yes.',
    'Signs point to yes.',
    'Reply hazy, try again.',
    'Ask again later.',
    'Better not tell you now.',
    'Cannot predict now.',
    'Concentrate and ask again.',
    'Don\'t count on it.',
    'My reply is no.',
    'My sources say no.',
    'Outlook not so good.',
    'Very doubtful.'
  ];

  const outlook = outlookList[Math.floor(Math.random() * outlookList.length)];
  ts.sendTextMessage(client.getID(), ev.targetmode, `8 Ball says: "${outlook}"`);
};

module.exports.info = {
  name: '8ball',
  usage: `${process.env.PREFIX}8ball`,
  desc: 'Asks a theoretical magic 8 ball for an outlook.',
  level: 2
};
