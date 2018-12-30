module.exports.run = async (ts, ev, client) => {
  let flipResult = null
  flipResult = Math.floor(Math.random() * 2)
  flipResult = (flipResult === 0) ? 'tails' : 'heads'

  if (ev.targetmode === 3) {
    ts.sendTextMessage('', 3, `Coin flipped! You landed on ${flipResult}.`)
  } else if (ev.targetmode === 2) {
    ts.sendTextMessage(client.getCache().cid, 2, `Coin flipped! You landed on ${flipResult}.`)
  } else {
    ts.sendTextMessage(client.getID(), 1, `Coin flipped! You landed on ${flipResult}.`)
  }
}

module.exports.info = {
  name: 'coinflip',
  usage: `${process.env.PREFIX}coinflip`,
  desc: 'Simply flips a coin and returns heads or tails.',
  level: 2
}
