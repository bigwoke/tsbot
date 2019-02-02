module.exports.run = async (ts, ev, client, args) => {
  let upperLimit = 6; let rollResult = null

  if (args[0] && Number.isInteger(parseInt(args[0])) && args[0] > 0) {
    upperLimit = args[0]
  }

  rollResult = Math.floor(Math.random() * Math.floor(upperLimit)) + 1

  ts.sendTextMessage(client.getID(), ev.targetmode, `On a die labeled 1 to ${upperLimit}, you rolled a ${rollResult}.`)
}

module.exports.info = {
  name: 'diceroll',
  usage: `${process.env.PREFIX}diceroll [sides]`,
  desc: 'Rolls a die using the inclusive upper limit given, or six if none is given.',
  level: 2
}
