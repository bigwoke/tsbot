const fs = require('fs')

function epochNumberToDate (epochSeconds, type) {
  let localeDate = new Date(0)
  localeDate.setUTCSeconds(epochSeconds)

  switch (type) {
    case 't': return localeDate.toLocaleTimeString('en-US')
    case 'd': return localeDate.toLocaleDateString('en-US')
    default: return `${localeDate.toLocaleDateString('en-US')} ${localeDate.toLocaleTimeString('en-US')}`
  }
}

function isObjectEmpty (obj) {
  return Object.keys(obj).length === 0
}

function createEmptyFileIfAbsent (file) {
  try {
    fs.accessSync(file)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    fs.writeFileSync(file, '{}')
  }
}

module.exports = {
  toDate: epochNumberToDate,
  isEmpty: isObjectEmpty,
  verifyFile: createEmptyFileIfAbsent
}
