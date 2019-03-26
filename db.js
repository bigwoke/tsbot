const cfg = require('./config.js')
const log = require('./log.js')
const MongoClient = require('mongodb').MongoClient

const url = `mongodb://${cfg.db.host}:${cfg.db.port}/${cfg.db.name}`

function mountData (ts) {
  MongoClient.connect(url, cfg.db.opts, (err, data) => {
    if (err) log.error('[DB] Database connection error:', err.stack)
    ts.data = data.db(cfg.db.name)
    setupData(ts)
  })
}

function setupData (ts) {
  let indexSpecs = [{ key: { name: 'text' }, unique: true }]
  ts.data.collection('users').createIndexes(indexSpecs, (err, res) => {
    if (err) log.error('[DB] Error setting collection index:', err.stack)
  })
}

module.exports.mount = mountData
