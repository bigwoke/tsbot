const cfg = require('./config.js')
const log = require('./log.js')
const MongoClient = require('mongodb').MongoClient

const url = `mongodb://${cfg.db.host}:${cfg.db.port}/${cfg.db.name}`

function mountData (ts) {
  MongoClient.connect(url, cfg.db.opts, (err, data) => {
    if (err) log.error('Database connection error:', err.stack)
    ts.data = data.db(cfg.db.name)
  })
}

module.exports.mount = mountData
