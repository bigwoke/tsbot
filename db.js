const cfg = require('./config.js')
const log = require('./log.js')
const MongoClient = require('mongodb').MongoClient

const url = buildURI()

function buildURI () {
  if (cfg.db.uri && cfg.db.uri.length > 0) {
    return cfg.db.uri
  }
  if (cfg.db.user && cfg.db.pass) {
    return `mongodb://${cfg.db.user}:${cfg.db.pass}@${cfg.db.host}:${cfg.db.port}`
  }
  log.warn('[DB] Warning: connecting to database without proper credentials.')
  return `mongodb://${cfg.db.host}:${cfg.db.port}/${cfg.db.name}`
}

function mountData (ts) {
  MongoClient.connect(url, cfg.db.opts, (err, data) => {
    if (err) log.error('[DB] Database connection error:', err.stack)
    ts.data = data.db(cfg.db.name)
    data = ts.data
    setupData(ts)
  })
}

function setupData (ts) {
  let userIndexSpecs = [{ key: { name: 'text' }, unique: true }]
  ts.data.collection('users').createIndexes(userIndexSpecs, (err, res) => {
    if (err) log.error('[DB] Error setting user collection index:', err.stack)
  })

  if (cfg.modules.quotes) {
    let quotesIndexSpecs = [{ key: { number: 1 }, unique: true }]
    ts.data.collection('quotes').createIndexes(quotesIndexSpecs, (err, res) => {
      if (err) log.error('[DB] Error settings quotes collection index:', err.stack)
    })

    ts.data.collection('counters').findOne({ _id: 'quotenumber' }, (err, res) => {
      if (err) log.error('[DB] Error querying counters collection:', err.stack)
      if (!res) {
        ts.data.collection('counters').insertOne({ _id: 'quotenumber', sequence_value: 0 })
      }
    })
  }
}

function getNextSequenceValue (ts, sequenceName, callback) {
  let query = { _id: sequenceName }
  let update = { $inc: { sequence_value: 1 } }
  let options = { returnOriginal: false }
  ts.data.collection('counters').findOneAndUpdate(query, update, options, (err, res) => { // Broken
    if (err) {
      callback(err)
    } else {
      callback(null, res.value.sequence_value)
    }
  })
}

module.exports.mount = mountData
module.exports.getNextSequenceValue = getNextSequenceValue
