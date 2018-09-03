module.exports.run = async (ts, ev, client) => {
    let flip_result = null;
    flip_result = Math.floor(Math.random() * 2);
    flip_result = (flip_result === 0) ? 'tails' : 'heads';

    if(ev.targetmode === 3) {
        ts.sendTextMessage('', 3, `Coin flipped! You landed on ${flip_result}.`);
    } else if(ev.targetmode === 2) {
        ts.sendTextMessage(client.getCache().cid, 2, `Coin flipped! You landed on ${flip_result}.`);
    } else {
        ts.sendTextMessage(client.getID(), 1, `Coin flipped! You landed on ${flip_result}.`);
    }
};

module.exports.info = {
    name: 'coinflip',
    usage: `${process.env.PREFIX}coinflip`,
    desc: 'Simply flips a coin and returns heads or tails.',
    level: 2
};