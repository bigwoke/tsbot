const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const log = require('./log');

function epochNumberToDate (epochSeconds, type) {
  const localeDate = new Date(0);
  localeDate.setUTCSeconds(epochSeconds);

  switch (type) {
    case 't': return localeDate.toLocaleTimeString('en-US');
    case 'd': return localeDate.toLocaleDateString('en-US');
    default: return `${localeDate.toLocaleDateString('en-US')} ${localeDate.toLocaleTimeString('en-US')}`;
  }
}

function isObjectEmpty (obj) {
  return Object.keys(obj).length === 0;
}

function createEmptyFileIfAbsent (file) {
  try {
    fs.access(file, fs.constants.R_OK, err => {
      if (err) log.error(err);
    });
  } catch (err) {
    if (err.code !== 'ENOENT') return log.error('Error accessing checked file:', err.stack);
    fs.writeFile(file, '{}');
  }
}

async function getFiles (dir) {
  const files = await fsp.readdir(dir);
  return Promise.all(files
    .map(f => path.join(dir, f))
    .map(async f => {
      const stats = await fsp.stat(f);
      return stats.isDirectory() ? getFiles(f) : f;
    }));
}

function flattenArray (arr, result = []) {
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i];

    if (Array.isArray(value)) {
      flattenArray(value, result);
    } else {
      result.push(value);
    }
  }
  return result;
}

module.exports = {
  toDate: epochNumberToDate,
  isEmpty: isObjectEmpty,
  verifyFile: createEmptyFileIfAbsent,
  getFiles: getFiles,
  flatArray: flattenArray
};
