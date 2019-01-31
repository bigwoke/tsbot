module.exports.run = async (ts, ev, client, args) => {
  let outlookList = [
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
  ]

  let outlook = outlookList[Math.floor(Math.random() * outlookList.length)]

  if (ev.targetmode === 3) {
    ts.sendTextMessage('', 3, `8 Ball says: "${outlook}"`)
  } else if (ev.targetmode === 2) {
    ts.sendTextMessage(client.getCache().cid, 2, `8 Ball says: "${outlook}"`)
  } else {
    ts.sendTextMessage(client.getID(), 1, `8 Ball says: "${outlook}"`)
  }
}

module.exports.info = {
  name: '8ball',
  usage: `${process.env.PREFIX}8ball`,
  desc: 'Asks a theoretical magic 8 ball for an outlook.',
  level: 2
}
