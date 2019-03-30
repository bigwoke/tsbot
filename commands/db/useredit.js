const log = require('../../log.js')

module.exports.run = async (ts, ev, client, args) => {
  if (!args[2]) return ts.sendTextMessage(client.getID(), 1, 'error: Missing argument(s)!')

  let match = await ts.data.collection('users').find({ name: args[0] }).toArray()
  if (match.length === 0) {
    return ts.sendTextMessage(client.getID(), 1, 'Could not find a user with that name.')
  } else if (match.length > 1) {
    log.warn('[DB] Multiple user documents with name', args[0])
    return ts.sendTextMessage(client.getID(), 1, 'ERR: Multiple users found with that name.')
  }

  if (!Object.keys(match[0]).includes(args[1] || args[1] === '_id')) {
    return ts.sendTextMessage(client.getID(), 1, 'Invalid key.')
  }

  let key = args[1]
  let validKeys = ['name', 'uid']
  let regexName = /^[a-z_ ]+$/i
  let regexUID = /^.{27}=$/

  for (let i = 2; i < args.length; i++) {
    let valid = checkValue(key, args[i], validKeys, [regexName, regexUID])
    if (!valid) return ts.sendTextMessage(client.getID(), 1, 'Invalid value.')

    let filter = { name: args[0] }
    let update = { $set: { [key]: args[i] } }

    if (Array.isArray(match[0][key])) {
      update = { $addToSet: { [key]: args[i] } }
    }

    ts.data.collection('users').updateOne(filter, update, (err, res) => {
      if (err) log.error('[DB] Error updating record', key)

      if (res.result.n === 0) {
        ts.sendTextMessage(client.getID(), 1, 'Couldn\'t find document, please report this bug.')
      } else if (res.result.n === 1 && res.result.nModified === 0 && res.result.ok === 1) {
        ts.sendTextMessage(client.getID(), 1, `${i - 1}: Not editing document, value already exists.`)
      } else if (res.result.nModified === 1) {
        ts.sendTextMessage(client.getID(), 1, `${i - 1}: Document successfully edited.`)
        log.info('[DB] Existing user document edited:', args[0], 'key changed:', key)
      } else {
        ts.sendTextMessage(client.getID(), 1, `${i - 1}: Issue editing document.`)
      }
    })
  }
}

function checkValue (key, value, validKeys, regex) {
  for (let i = 0; i < validKeys.length; i++) {
    if (key !== validKeys[i]) continue
    if (regex[i].test(value)) {
      return true
    } else {
      return false
    }
  }
}

module.exports.info = {
  name: 'useredit',
  usage: `${process.env.PREFIX}useredit <name> <key> <new value> [new value 2...]`,
  desc: 'Edits an existing user document.',
  module: 'db',
  level: 0
}
