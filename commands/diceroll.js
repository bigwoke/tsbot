module.exports.run = async (ts, ev, client, args) => {
    let upper_limit = 6, roll_result = null;

    if( args[0] && Number.isInteger(parseInt(args[0])) && args[0] > 0 ) {
        upper_limit = args[0];
    }
    
    roll_result = Math.floor(Math.random() * Math.floor(upper_limit)) + 1;

    if(ev.targetmode === 3) {
        ts.sendTextMessage('', 3, `On a die labeled 1 to ${upper_limit}, you rolled a ${roll_result}.`);
    } else if(ev.targetmode === 2) {
        ts.sendTextMessage(client.getCache().cid, 2, `On a die labeled 1 to ${upper_limit}, you rolled a ${roll_result}.`);
    } else {
        ts.sendTextMessage(client.getID(), 1, `On a die labeled 1 to ${upper_limit}, you rolled a ${roll_result}.`);
    }
};

module.exports.info = {
    name: 'diceroll',
    usage: `${process.env.PREFIX}diceroll [sides]`,
    desc: 'Rolls a die using the inclusive upper limit given, or six if none is given.',
    level: 2
};